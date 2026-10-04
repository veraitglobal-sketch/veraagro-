import { PassportDocumentsService } from './passport-documents.service';
import { StoredDocumentsService } from '../stored-documents/stored-documents.service';

describe('Passport document ownership and visibility', () => {
  function setup() {
    const db = {
      estates: { findMany: jest.fn().mockResolvedValue([{id:'own'}]), findFirst: jest.fn().mockResolvedValue({id:'own'}) },
      catalog_products: { findFirst: jest.fn().mockResolvedValue(null) },
      passport_documents: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn() },
      passport_reports: { findFirst: jest.fn().mockResolvedValue(null) },
      stored_documents: { findUnique: jest.fn().mockResolvedValue({ mimeType:'image/jpeg', data:Buffer.from('image'), fileName:'x.jpg' }) },
    };
    const files = { save: jest.fn() };
    return { db, files, service: new PassportDocumentsService(db as any, files as any) };
  }
  it('combines owner scope with requested product instead of broadening access', async () => {
    const {db,service}=setup(); await service.listForGrower('user',undefined,'foreign');
    expect(db.passport_documents.findMany).toHaveBeenCalledWith(expect.objectContaining({where:{estateId:{in:['own']},catalogProductId:'foreign'}}));
  });
  it('rejects a foreign product before storing its attachment', async () => {
    const {service,files}=setup();
    await expect(service.createForGrower('user', {title:'Certificate',docType:'CERTIFICATE',scope:'PRODUCT',estateId:'own',catalogProductId:'foreign',file:{buffer:Buffer.from('x'),size:1,mimetype:'application/pdf'}})).rejects.toThrow('Product does not belong');
    expect(files.save).not.toHaveBeenCalled();
  });
  it('does not publish a merely reviewed document', async () => {
    const {db,service}=setup(); await service.listPublicForCatalogProduct('product');
    expect(db.passport_documents.findMany.mock.calls[0][0].where.verificationStatus).toBe('CONFIRMED');
  });
  it('hides a report photo from anonymous users and serves it to an admin', async () => {
    const {db}=setup();db.passport_reports.findFirst.mockResolvedValue({id:'report'});
    const files=new StoredDocumentsService(db as any);
    await expect(files.get('photo')).rejects.toThrow('Document not found');
    await expect(files.get('photo',{id:'admin',roles:['ADMIN']})).resolves.toMatchObject({mimeType:'image/jpeg'});
  });
  it('serves an internal document only to its owner/admin, then allows public access after confirmation', async () => {
    const {db}=setup();db.passport_documents.findMany.mockResolvedValue([{estateId:'own',isPublic:false,verificationStatus:'UPLOADED'}]);
    const files=new StoredDocumentsService(db as any);
    await expect(files.get('doc')).rejects.toThrow('Document not found');
    db.estates.findFirst.mockResolvedValue(null);
    await expect(files.get('doc',{id:'other',roles:['GROWER']})).rejects.toThrow('Document not found');
    db.estates.findFirst.mockResolvedValue({id:'own'});
    await expect(files.get('doc',{id:'owner',roles:['GROWER']})).resolves.toHaveProperty('data');
    db.passport_documents.findMany.mockResolvedValue([{estateId:'own',isPublic:true,verificationStatus:'CONFIRMED'}]);
    await expect(files.get('doc')).resolves.toHaveProperty('data');
  });
});
