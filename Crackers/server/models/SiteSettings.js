import mongoose from 'mongoose';

const BankDetailsSchema = new mongoose.Schema({
  account_holder: { type: String, default: '' },
  bank_name: { type: String, default: '' },
  account_number: { type: String, default: '' },
  ifsc_code: { type: String, default: '' },
  branch: { type: String, default: '' },
}, { _id: false });

const SiteSettingsSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: 'site_settings' },
  bank_details: { type: BankDetailsSchema, default: () => ({}) },
  updated_at: { type: Date, default: Date.now },
}, { versionKey: false });

export const SiteSettings = mongoose.models.SiteSettings || mongoose.model('SiteSettings', SiteSettingsSchema);

export async function getSiteSettings() {
  let settings = await SiteSettings.findOne({ id: 'site_settings' }).lean();
  if (!settings) {
    settings = (await SiteSettings.create({ id: 'site_settings' })).toObject();
  }
  return settings;
}
