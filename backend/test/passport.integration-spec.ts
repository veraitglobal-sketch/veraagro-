import { TreatmentLogsService } from '../src/treatment-logs/treatment-logs.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import request = require('supertest');
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { CatalogController } from '../src/catalog/catalog.controller';
import { CatalogService } from '../src/catalog/catalog.service';
import { PassportDocumentsController } from '../src/passport-documents/passport-documents.controller';
import { PassportDocumentsService } from '../src/passport-documents/passport-documents.service';
import { PassportReportsController } from '../src/passport-reports/passport-reports.controller';
import { PassportReportsService } from '../src/passport-reports/passport-reports.service';
import { StoredDocumentsController } from '../src/stored-documents/stored-documents.controller';
import { StoredDocumentsService } from '../src/stored-documents/stored-documents.service';
import { QrController } from '../src/qr/qr.controller';
import { QrService } from '../src/qr/qr.service';
import { QualityControlLevelsService } from '../src/quality-control-levels/quality-control-levels.service';
import { FieldEntriesController } from '../src/field-entries/field-entries.controller';
import { FieldEntriesService } from '../src/field-entries/field-entries.service';
import { MaterialBarcodeValidationService } from '../src/compliance/material-barcode-validation.service';
import { SmartLockService } from '../src/smart-lock/smart-lock.service';
import { SeedProductionService } from '../src/seed-production/seed-production.service';

const url = process.env.BIOVERA_TEST_DATABASE_URL;
if (!url || process.env.NODE_ENV !== 'test' || process.env.DATABASE_URL !== url || new URL(url).hostname !== '127.0.0.1' || new URL(url).pathname !== '/biovera_test') throw Error('Disposable test database required');

describe('Passport product, documents and reports (HTTP + PostgreSQL)', () => {
  let app:INestApplication,db:PrismaService,productId:string;
  const jwt=new JwtService({secret:'isolated-integration-test-secret'});
  const req=(method:'get'|'post'|'patch',path:string,actor?:string)=>{
    const call=request(app.getHttpServer())[method](path);
    return actor?call.auth(jwt.sign({sub:actor}),{type:'bearer'}):call;
  };
  beforeAll(async()=>{
    const module=await Test.createTestingModule({imports:[PassportModule],
      controllers:[CatalogController,PassportDocumentsController,PassportReportsController,StoredDocumentsController,QrController,FieldEntriesController],
      providers:[PrismaService,JwtStrategy,CatalogService,PassportDocumentsService,PassportReportsService,StoredDocumentsService,QrService,
        FieldEntriesService, TreatmentLogsService,
        {provide:MaterialBarcodeValidationService,useValue:{assertValidForGrower:jest.fn().mockResolvedValue(undefined)}}, {provide:SmartLockService,useValue:{}}, {provide:SeedProductionService,useValue:{}},
        {provide:ConfigService,useValue:{get:()=> 'isolated-integration-test-secret'}},
        {provide:QualityControlLevelsService,useValue:{getProtocol360Status:async()=>({levels:[],overallStatus:'PENDING'})}}],
    }).compile();
    app=module.createNestApplication();app.useLogger(false);app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true}));
    await app.listen(0,'127.0.0.1');db=app.get(PrismaService);
  });
  afterAll(async()=>{await app?.close();});
  beforeEach(async()=>{
    await db.$executeRawUnsafe('TRUNCATE users, passport_reports, passport_documents, stored_documents, field_entries CASCADE');
    for(const id of ['grower','other','admin'])await db.users.create({data:{id,partnerCode:id,firstName:id,lastName:'Test',passwordHash:'not-login',status:'ACTIVE',roles:[id==='admin'?'SUPER_ADMIN':'GROWER'],updatedAt:new Date()}});
    for(const id of ['grower','other'])await db.estates.create({data:{id:`farm-${id}`,ownerId:id,name:`Farm ${id}`,polygonCoordinates:[],calculatedArea:1,status:'ACTIVE',updatedAt:new Date()}});
    const p=await req('post','/catalog/grower/products','grower').send({name:'Apple',variety:'Gala',description:'Product description',storageConditions:'Cool and dry',estateId:'farm-grower',plannedQuantityKg:100}).expect(201);productId=p.body.id;
    await db.batches.create({data:{id:'lot',batchId:'LOT-PASS',estateId:'farm-grower',productName:'Apple',catalogProductId:productId,quantity:100,unit:'kg',harvestDate:new Date(),locationHistory:[],updatedAt:new Date()}});
  });

  it('records mobile operations once, enforces parcel/planting ownership, and feeds the matching lot and treatment register', async () => {
    const gps={lat:43.9,lng:20.3,accuracy:5};
    await db.parcels.create({data:{id:'ops-parcel',estateId:'farm-grower',polygonCoordinates:[gps],calculatedArea:100,status:'ACTIVE',approvedAt:new Date(),updatedAt:new Date()}});
    for (const id of ['ops-planting','unrelated-planting']) await db.harvest_announcements.create({data:{id,userId:'grower',parcelId:'ops-parcel',announcementType:'PLANTING',cropType:'Raspberry',estimatedDate:new Date('2026-03-01'),status:'CONFIRMED',updatedAt:new Date()}});
    await db.harvest_announcements.create({data:{id:'ops-harvest',sourcePlantingId:'ops-planting',userId:'grower',parcelId:'ops-parcel',announcementType:'HARVEST',cropType:'Raspberry',estimatedDate:new Date('2026-07-01'),status:'CONFIRMED',updatedAt:new Date()}});
    await db.batches.update({where:{id:'lot'},data:{parcelId:'ops-parcel',harvestAnnouncementId:'ops-harvest'}});
    const base={farmId:'farm-grower',data:{parcelId:'ops-parcel',plantingId:'ops-planting',location:gps,photos:['data:image/jpeg;base64,dGVzdA==']}};
    const irrigation={...base,type:'IRRIGATION',clientReference:'watering-once',data:{...base.data,operation:{type:'IRRIGATION',occurredAt:'2026-05-01T06:00:00Z',endedAt:'2026-05-01T07:00:00Z',waterLitres:500,areaHa:0.25,method:'Drip'}}};
    await req('post','/field-entries','other').send(irrigation).expect(404);
    await req('post','/field-entries','grower').send({...irrigation,data:{...irrigation.data,plantingId:'unknown'}}).expect(403);
    await req('post','/field-entries','grower').send({...irrigation,data:{...irrigation.data,location:{lat:45,lng:21}}}).expect(403);
    await req('post','/field-entries','grower').send({...irrigation,data:{...irrigation.data,photos:[]}}).expect(400);
    await req('post','/field-entries','grower').send({...irrigation,data:{...irrigation.data,operation:{...irrigation.data.operation,waterLitres:-2}}}).expect(400);
    const saved=(await req('post','/field-entries','grower').send(irrigation).expect(201)).body;
    expect((await req('post','/field-entries','grower').send(irrigation).expect(201)).body.id).toBe(saved.id);
    await req('post','/field-entries','grower').send({...irrigation,data:{...irrigation.data,operation:{...irrigation.data.operation,waterLitres:600}}}).expect(409);
    const product={id:'00000000-0000-4000-8000-000000000001',barcode:'TEST-SPRAY',productName:'Test registered material',manufacturer:'Fixture',materialType:'PESTICIDE',phiDays:7,addedBy:'admin',updatedAt:new Date()};
    await db.bio_white_list.upsert({where:{id:product.id},create:product,update:product});
    const spraying={...base,type:'SPRAYING',fertilizerBarcode:product.barcode,clientReference:'spray-once',data:{...base.data,operation:{type:'SPRAYING',occurredAt:'2026-05-02T06:15:00Z',materialName:'Name entered on phone',quantity:2,unit:'L',waterLitres:400,notes:'Recorded field work'}}};
    const sprayed=await Promise.all([1,2].map(()=>req('post','/field-entries','grower').send(spraying).expect(201)));
    expect(sprayed[0].body.id).toBe(sprayed[1].body.id);
    expect(await db.treatment_logs.count({where:{parcelId:'ops-parcel'}})).toBe(1);
    expect(await db.treatment_logs.findFirst({where:{parcelId:'ops-parcel'}})).toMatchObject({productId:product.id,productName:product.productName,appliedAt:new Date('2026-05-02T06:15:00Z'),waterVolume:400,dosage:'2 L'});
    expect(app.get(MaterialBarcodeValidationService).assertValidForGrower).toHaveBeenCalledWith('grower',product.barcode,'PESTICIDE',expect.any(Object));
    const inspection={...base,type:'INSPECTION',clientReference:'visit-once',data:{...base.data,operation:{type:'INSPECTION',occurredAt:'2026-05-03T08:00:00Z',notes:'Leaf inspection recorded'}}};
    await req('post','/field-entries','grower').send(inspection).expect(201);
    await req('post','/field-entries','grower').send({...inspection,clientReference:'other-visit',data:{...inspection.data,plantingId:'unrelated-planting',operation:{...inspection.data.operation,notes:'Unrelated planting'}}}).expect(201);
    const fertilizerProduct={...product,id:'00000000-0000-4000-8000-000000000002',barcode:'TEST-FERTILIZER',materialType:'FERTILIZER'};
    await db.bio_white_list.upsert({where:{id:fertilizerProduct.id},create:fertilizerProduct,update:fertilizerProduct});
    const fertilizer={...spraying,fertilizerBarcode:fertilizerProduct.barcode,type:'FERTILIZING',clientReference:'fertilize-once',data:{...spraying.data,operation:{...spraying.data.operation,type:'FERTILIZING'}}};
    await req('post','/field-entries','grower').send(fertilizer).expect(201);
    expect(app.get(MaterialBarcodeValidationService).assertValidForGrower).toHaveBeenCalledWith('grower',fertilizerProduct.barcode,'FERTILIZER',expect.any(Object));
    expect(await db.treatment_logs.count({where:{parcelId:'ops-parcel'}})).toBe(1);
    expect((await app.get(TreatmentLogsService).getEarliestHarvestDate('ops-parcel')).date?.toISOString()).toBe('2026-05-09T06:15:00.000Z');
    await req('post','/field-entries','grower').send({...spraying,clientReference:'wrong-material',fertilizerBarcode:fertilizerProduct.barcode}).expect(400);
    const passport=(await req('get','/qr/verify/LOT-PASS').expect(200)).body;
    const water=passport.productionHistory.find(e=>e.kind==='irrigation');
    expect(water).toMatchObject({date:'2026-05-01T06:00:00.000Z',endDate:'2026-05-01T07:00:00.000Z',source:'fieldDiary',photos:base.data.photos});
    expect(water.facts).toEqual(expect.arrayContaining([{label:'waterLitres',value:'500 L'},{label:'method',value:'Drip'},{label:'area',value:'0.25'}]));
    expect(passport.productionHistory.filter(e=>e.kind==='inspection')).toHaveLength(1);
    expect(JSON.stringify(passport.productionHistory)).not.toContain('Unrelated planting');
    expect(passport.treatments).toEqual(expect.arrayContaining([expect.objectContaining({productName:product.productName,waterVolume:400,dosage:'2 L'})]));
    expect(passport.productionHistory.filter(e=>e.kind==='treatment')).toHaveLength(2);
    expect(passport.productionHistory.find(e=>e.kind==='treatment').facts).toContainEqual({label:'materialBarcode',value:product.barcode});
  });

  it('saves planting weather through HTTP and shows its source, period and frost separately from cold-chain readings', async () => {
    await db.parcels.create({data:{id:'weather-parcel',estateId:'farm-grower',polygonCoordinates:[],calculatedArea:100,status:'ACTIVE',updatedAt:new Date()}});
    await db.harvest_announcements.create({data:{id:'weather-planting',userId:'grower',parcelId:'weather-parcel',announcementType:'PLANTING',cropType:'Raspberry',estimatedDate:new Date('2026-03-01'),actualDate:new Date('2026-03-02'),status:'CONFIRMED',updatedAt:new Date()}});
    await db.harvest_announcements.create({data:{id:'weather-harvest',sourcePlantingId:'weather-planting',userId:'grower',parcelId:'weather-parcel',announcementType:'HARVEST',cropType:'Raspberry',estimatedDate:new Date('2026-07-01'),status:'CONFIRMED',updatedAt:new Date()}});
    await db.batches.update({where:{id:'lot'},data:{parcelId:'weather-parcel',harvestAnnouncementId:'weather-harvest',harvestDate:new Date('2026-07-01')}});
    const body={type:'WEATHER',farmId:'farm-grower',clientReference:'weather-retry',data:{parcelId:'weather-parcel',plantingId:'weather-planting',weather:{from:'2026-03-20T01:00:00Z',until:'2026-03-20T04:00:00Z',minimumC:-2,maximumC:1,frostObserved:true,source:'SENSOR'},notes:'Observation from field diary'}};
    await req('post','/field-entries','other').send(body).expect(404);
    await req('post','/field-entries','grower').send({...body,data:{...body.data,plantingId:'unknown'}}).expect(403);
    await req('post','/field-entries','grower').send({...body,data:{...body.data,weather:{...body.data.weather,minimumC:10}}}).expect(400);
    const saved=(await req('post','/field-entries','grower').send(body).expect(201)).body;
    expect(saved.data.weather.source).toBe('GROWER_OBSERVATION');
    const retried=(await req('post','/field-entries','grower').send(body).expect(201)).body;
    expect(retried.id).toBe(saved.id);
    const passport=(await req('get','/qr/verify/LOT-PASS').expect(200)).body;
    const weather=passport.productionHistory.find(e=>e.kind==='weather');
    expect(weather).toMatchObject({date:'2026-03-20T01:00:00.000Z',endDate:'2026-03-20T04:00:00.000Z',source:'fieldDiary'});
    expect(weather.facts).toEqual(expect.arrayContaining([{label:'temperature',value:'-2 – 1 °C'},{label:'frost',value:'yes'}]));
    expect(passport.historyGaps).not.toContain('weather');
    expect(passport.historyGaps).toContain('seed');
    expect(passport.coldChainProof.hasReadings).toBe(false);
    expect(passport.parcelInfo.plantingDate).toBe('2026-03-02T00:00:00.000Z');
  });
  it('passes saved product data into the public passport and disallows another owner changing it',async()=>{
    const result=await req('get','/qr/verify/LOT-PASS').expect(200);
    expect(result.body.summary).toMatchObject({productName:'Apple',variety:'Gala',productDescription:'Product description',storage:{productStorageConditions:'Cool and dry'}});
    await req('patch',`/catalog/grower/products/${productId}`,'other').send({name:'Wrong'}).expect(403);
    await req('patch',`/catalog/grower/products/${productId}`,'grower').send({estateId:'farm-other'}).expect(403);
  });
  it('keeps uploads private until confirmed and prevents cross-owner document association',async()=>{
    const upload=()=>req('post','/passport-documents/grower','grower').field('title','Product certificate').field('docType','CERTIFICATE').field('scope','PRODUCT').field('estateId','farm-grower').field('catalogProductId',productId).attach('file',Buffer.from('%PDF-1.4\nTest'),{filename:'certificate.pdf',contentType:'application/pdf'});
    const doc=(await upload().expect(201)).body;
    await req('get',`/documents/${doc.fileDocumentId}`).expect(404);
    await req('get',`/documents/${doc.fileDocumentId}`,'other').expect(404);
    await req('get',`/documents/${doc.fileDocumentId}`,'grower').expect(200);
    await req('get',`/documents/${doc.fileDocumentId}`,'admin').expect(200);
    expect((await req('get',`/passport-documents/grower?catalogProductId=${productId}`,'other').expect(200)).body).toEqual([]);
    expect((await req('get','/qr/verify/LOT-PASS').expect(200)).body.passportDocuments).toEqual([]);
    await req('patch',`/admin/passport-documents/${doc.id}/verify`,'admin').send({status:'CONFIRMED',isPublic:true}).expect(200);
    await req('get',`/documents/${doc.fileDocumentId}`).expect(200);
    expect((await req('get','/qr/verify/LOT-PASS').expect(200)).body.passportDocuments).toEqual(expect.arrayContaining([expect.objectContaining({title:'Product certificate'})]));
    await req('post','/passport-documents/grower','other').field('title','Wrong').field('docType','OTHER').field('scope','PRODUCT').field('estateId','farm-other').field('catalogProductId',productId).attach('file',Buffer.from('x'),{filename:'x.pdf',contentType:'application/pdf'}).expect(403);
  });
  it('delivers one report to admin under retries and keeps its attachment private',async()=>{
    const body={description:'The package was damaged',contactEmail:'buyer@example.invalid',idempotencyKey:'passport-report-retry-001',photoDataUrl:'data:image/png;base64,iVBORw0KGgo='};
    const responses=await Promise.all([1,2].map(()=>req('post','/qr/verify/LOT-PASS/report').send(body).expect(201)));
    expect(responses[0].body.reportNumber).toBe(responses[1].body.reportNumber);
    const rows=(await req('get','/admin/passport-reports','admin').expect(200)).body;expect(rows).toHaveLength(1);
    await req('get','/admin/passport-reports','grower').expect(403);
    const detail=(await req('get',`/admin/passport-reports/${rows[0].id}`,'admin').expect(200)).body;
    expect(detail).toMatchObject({description:body.description,contactEmail:body.contactEmail,batch:{productName:'Apple'}});
    await req('get',`/documents/${detail.photoDocumentId}`).expect(404);
    await req('get',`/documents/${detail.photoDocumentId}`,'admin').expect(200);
    await req('patch',`/admin/passport-reports/${rows[0].id}/status`,'admin').send({status:'RESOLVED',adminNotes:'Reviewed'}).expect(200);
    const stored=await db.passport_reports.findUniqueOrThrow({where:{id:rows[0].id}});expect(stored.status).toBe('RESOLVED');expect(stored.resolvedBy).toBe('admin');
  });
});
