import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewDeliveryDto } from './dto/delivery-workflow.dto';

export async function reviewDelivery(db: PrismaService, actor: string, kind: string, id: string, dto: ReviewDeliveryDto) {
  if (!['issue', 'dispute'].includes(kind)) throw new NotFoundException('Report not found');
  return db.$transaction(async (tx) => {
    // Match handover → dispute lock order used by completion when reopening a quality check.
    if (kind === 'dispute') {
      const dispute = await tx.disputes.findUnique({ where: { id }, select: { handoverId: true } });
      if (!dispute) throw new NotFoundException('Report not found');
      await tx.$queryRaw`SELECT id FROM digital_handovers WHERE id = ${dispute.handoverId} FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM disputes WHERE id = ${id} FOR UPDATE`;
    } else await tx.$queryRaw`SELECT id FROM buyer_delivery_issues WHERE id = ${id} FOR UPDATE`;
    const row = kind === 'issue' ? await tx.buyer_delivery_issues.findUnique({ where: { id } }) : await tx.disputes.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Report not found');
    const resolution = dto.resolution?.trim();
    if (row.status === 'RESOLVED' && dto.action === 'RESOLVE' && row.outcome === dto.outcome && row.resolution === resolution) return row;
    if (row.revision !== dto.revision || row.status === 'RESOLVED') throw new ConflictException('Report changed. Refresh before deciding.');
    if (dto.action === 'START_REVIEW' && row.status !== 'PENDING') throw new ConflictException('Report is already being reviewed');
    if (dto.action === 'RESOLVE') {
      if (row.status !== 'IN_REVIEW') throw new BadRequestException('Start review first');
      if (!resolution || resolution.length < 20) throw new BadRequestException('Explain the decision in at least 20 characters');
      const outcomes = kind === 'issue' ? ['ACCEPTED', 'REJECTED'] : ['REINSPECTION', 'RETURN_REQUIRED'];
      if (!outcomes.includes(dto.outcome)) throw new BadRequestException('Choose an outcome appropriate to this report');
    }
    const data = { status: dto.action === 'START_REVIEW' ? 'IN_REVIEW' : 'RESOLVED', resolvedBy: actor,
      revision: { increment: 1 }, ...(dto.action === 'RESOLVE' ? { resolution, outcome: dto.outcome, resolvedAt: new Date() } : {}) };
    const updated = kind === 'issue' ? await tx.buyer_delivery_issues.update({ where: { id }, data }) : await tx.disputes.update({ where: { id }, data });
    if (kind === 'dispute' && dto.action === 'RESOLVE' && dto.outcome === 'REINSPECTION') {
      const handoverId = (row as { handoverId: string }).handoverId;
      const handover = await tx.digital_handovers.findUniqueOrThrow({ where: { id: handoverId } });
      if (handover.status !== 'DISPUTED') throw new ConflictException('Handover is no longer disputed');
      const delivery = await tx.deliveries.findUniqueOrThrow({ where: { id: handover.deliveryId } });
      if (delivery.status !== 'IN_TRANSIT') throw new ConflictException('Delivery cannot be reinspected in its current state');
      // Original photographs/reason remain in the resolved dispute; no automatic buyer signature.
      await tx.digital_handovers.update({ where: { id: handoverId }, data: { status: 'INITIATED', completedAt: null,
        revision: { increment: 1 }, completedBy: null, qualityStatus: null, signature: null, photoUrls: [], notes: null, temperature: null } });
    }
    await tx.audit_trails.create({ data: { id: randomUUID(), eventType: 'STATUS_CHANGE', entityType: 'DeliveryReview', entityId: id,
      performedByUserId: actor, oldValue: { status: row.status, revision: row.revision },
      newValue: { kind, status: updated.status, outcome: updated.outcome, resolution: updated.resolution, revision: updated.revision } } });
    return updated;
  });
}
