/**
 * English UI copy — single locale for now. Import `en` from `@/lib/messages`.
 * Add `sr.ts` later and a small loader if you introduce multi-language.
 */
export const en = {
  common: {
    requestFailed: 'Request failed',
    emDash: '—',
    unitKg: 'kg',
  },
  grower: {
    nav: {
      dashboard: 'Dashboard',
      steps: 'Steps',
      myFields: 'My fields',
      materials: 'Materials',
      suppliersAndOrders: 'Suppliers & orders',
      myBatches: 'My batches',
      qualityEntry: 'Quality entry',
      compliancePhotos: 'Compliance photos',
      requestTransport: 'Request transport',
      missionTracker: 'Mission tracker',
      myProfile: 'My profile',
    },
    compliancePhotos: {
      pageTitle: 'Compliance Photos',
      checklistHeading: 'Photo-Verification Checklist',
      introBeforeStrong: 'One lot = one ',
      introStrong: 'label roll ID',
      introAfterStrong:
        ' (the material you bought) + three photos documenting how that lot was packed. You are not entering a separate ID for every crate, pallet, or 30L roll — you pick the ',
      introEmphasisOne: 'one',
      introEnd: " official sticker roll used for this batch's labels.",
      explainerTitle: 'What is Sticker Roll ID (not “per box” or “per pallet”)?',
      explainerBullets: [
        'Sticker Roll ID is the serial of your purchased Bio Vera label roll (QR stickers). It proves which official material you used. One ID per lot in this form — the same ID whether you photograph punnets, a label close-up, or palletization.',
        'The three photos are evidence of how you applied packaging: logo on punnets, a readable sticker/QR, and film/palletization. They are not three different roll serials.',
        'If you have many label rolls in stock, choose the roll you actually used for this lot from the list (or type the serial) — you do not register every roll number on your farm here.',
      ],
      materialsLink: 'Materials',
      idFormatHint: 'IDs are created when you order rolls from',
      idFormatExample: 'Example format:',
      selectLot: 'Select lot (batch) *',
      loadingBatches: 'Loading batches…',
      noBatches:
        'No batches yet.',
      createBatch: 'Create a batch',
      noBatchesSuffix: 'for an approved parcel first.',
      selectBatchPlaceholder: '-- Select batch --',
      loadingStatus: 'Loading compliance status for this lot…',
      resolvedBadge: 'Resolved for this lot',
      complianceCompleteTitle: 'Compliance complete',
      resolvedBody:
        'has the required photos and a label roll on file. You do not need to repeat the steps unless you are correcting something.',
      resolvedLotPrefix: 'Lot',
      stickerRollDt: 'Sticker Roll ID (label stock)',
      lastUpdated: 'Last updated',
      photoTypesOnFile: 'Photo types on file',
      updatePhotosCta: 'Update photos or change label roll',
      stickerRollLabel: 'Sticker Roll ID *',
      pickRollPlaceholder: '— Pick from your label rolls (fastest) —',
      rollAvailable: '· available',
      rollOnLot: '· on this lot',
      stickerInputPlaceholder: 'Or type / scan exact serial (LABEL-ROLL-…)',
      verify: 'Verify',
      stickerHelp:
        'Choose one serial from the dropdown if you have many — only the roll you use for this lot matters here.',
      requiredPhotosHeading: 'Required compliance photos',
      photoAddedPending: 'Photo added (not yet saved until you submit)',
      clickToUpload: 'Click to upload',
      cancelKeep: 'Cancel and keep existing compliance',
      saveSubmit: 'Save compliance (photos + roll)',
      uploading: 'Uploading...',
      replaceWarning:
        'Re-saving replaces the previous photos for {batchId} and keeps or updates the label roll you confirm below.',
      statusLoadError:
        'Status for this lot could not be loaded. You can still fill the form; after saving, the page will show “Resolved” when everything is on file.',
      photoTypes: {
        PUNNETS: {
          label: 'Punnets with Bio Vera Logo',
          description: 'Show our logo on the crates',
        },
        LABELING: {
          label: 'Labeling Close-up',
          description: 'Close-up of our official sticker with QR code',
        },
        PALLETIZATION: {
          label: 'Palletization',
          description: 'Showing our specific protective film is used',
        },
      },
      feedback: {
        stickerVerified: 'Sticker roll verified successfully!',
        saveSuccess: 'Compliance saved. This lot is marked complete for photos and label roll.',
      },
      errors: {
        selectBatchAndSticker: 'Please select a batch and enter sticker roll ID',
        verifyFailed: 'Failed to verify sticker roll',
        verificationFailed: 'Verification failed',
        missingPhotos: 'Please upload all required photos: {labels}',
        uploadFailed: 'Failed to upload compliance photos',
        genericUploadError: 'Upload failed',
        photoSize: 'Photo size must be less than 10MB',
      },
    },
  },
} as const;

export type EnMessages = typeof en;
