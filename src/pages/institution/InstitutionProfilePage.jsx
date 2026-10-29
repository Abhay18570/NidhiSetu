import { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Building2, Save, AlertCircle, CheckCircle2, Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InstitutionProfilePage() {
  const { currentInstitution, currentUser, updateInstitutionProfile, updateUserProfile } = useAuth();

  const [formData, setFormData] = useState({
    representativeName: '',
    representativeDesignation: '',
    representativePhone: '',
    address: '',
    city: '',
    district: '',
    pincode: '',
  });

  const [initialData, setInitialData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (currentInstitution) {
      const data = {
        representativeName: currentInstitution.representativeName || currentUser?.name || '',
        representativeDesignation: currentInstitution.representativeDesignation || currentUser?.designation || '',
        representativePhone: currentInstitution.representativePhone || currentUser?.phone || '',
        address: currentInstitution.address || '',
        city: currentInstitution.city || '',
        district: currentInstitution.district || '',
        pincode: currentInstitution.pincode || '',
      };
      setFormData(data);
      setInitialData(data);
    }
  }, [currentInstitution, currentUser]);

  useEffect(() => {
    const isDifferent = Object.keys(formData).some((key) => formData[key] !== initialData[key]);
    setHasChanges(isDifferent);
  }, [formData, initialData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
    setErrorMessage('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.representativeName || !formData.representativePhone || !formData.pincode) {
      setErrorMessage('Please fill in all required contact and location fields.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      // Update institution record
      await updateInstitutionProfile({
        representativeName: formData.representativeName,
        representativeDesignation: formData.representativeDesignation,
        representativePhone: formData.representativePhone,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        pincode: formData.pincode,
      });

      // Also update user record for current representative
      await updateUserProfile({
        name: formData.representativeName,
        designation: formData.representativeDesignation,
        phone: formData.representativePhone,
      });

      setInitialData(formData);
      setHasChanges(false);
      setSaveSuccess(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Breadcrumb & Heading */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            to="/institution/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#174EA6] hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-black text-[#0B1F54]">
            Manage Institution Profile
          </h1>
          <p className="text-xs sm:text-sm text-[#505F79] mt-0.5">
            Maintain institutional contact details, authorized representative credentials, and official campus location.
          </p>
        </div>

        {hasChanges && (
          <Badge variant="saffron" size="md">
            Unsaved Changes
          </Badge>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 bg-[#E6F4EA] border border-[#13805E]/30 rounded-xl text-xs flex items-center gap-3 text-[#13805E] animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-bold">Profile changes saved successfully!</span> Changes have been recorded in the prototype localStorage database and logged to the audit repository.
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs flex items-center gap-3 text-rose-700 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Read-Only Regulatory Identifiers */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#505F79]" />
              <h2 className="text-sm font-bold text-[#0B1F54] uppercase tracking-wider">
                1. Statutory Regulatory Record (Read-Only)
              </h2>
            </div>
            <span className="text-[0.6875rem] text-[#505F79]">Immutable statutory identifiers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">Institution Legal Name</label>
              <input
                type="text"
                disabled
                value={currentInstitution?.name || ''}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md font-semibold text-slate-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1">AISHE Permanent Code</label>
              <input
                type="text"
                disabled
                value={currentInstitution?.aisheCode || ''}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md font-mono font-bold text-[#174EA6] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1">State / UT Jurisdiction</label>
              <input
                type="text"
                disabled
                value={currentInstitution?.state || ''}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md font-medium text-slate-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Self-Declared Approval Status</label>
              <input
                type="text"
                disabled
                value={currentInstitution?.approvalStatus || 'Self-Declared AICTE Approved'}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md font-semibold text-[#13805E] cursor-not-allowed"
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Editable Representative Details */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#174EA6]" />
              <h2 className="text-sm font-bold text-[#0B1F54] uppercase tracking-wider">
                2. Authorized Nodal Officer & Signatory
              </h2>
            </div>
            <span className="text-[0.6875rem] text-[#174EA6] font-semibold">Editable Credentials</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                Representative Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.representativeName}
                onChange={(e) => handleChange('representativeName', e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                Designation / Office *
              </label>
              <input
                type="text"
                required
                value={formData.representativeDesignation}
                onChange={(e) => handleChange('representativeDesignation', e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                Official Contact Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.representativePhone}
                onChange={(e) => handleChange('representativePhone', e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                Official Account Email
              </label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ''}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Editable Campus Location */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-[#0B1F54] uppercase tracking-wider">
              3. Campus Street Address & Postal Details
            </h2>
            <span className="text-[0.6875rem] text-[#174EA6] font-semibold">Editable Location</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                Street Address / Campus Premises *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                City / Town *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                District *
              </label>
              <input
                type="text"
                required
                value={formData.district}
                onChange={(e) => handleChange('district', e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B1F54] mb-1">
                Postal PIN Code *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={formData.pincode}
                onChange={(e) => handleChange('pincode', e.target.value)}
                className="w-full px-3 py-2 bg-[#F5F7FB] border border-[#D3DDEB] rounded-md text-sm font-mono text-[#0B1F54] focus:outline-none focus:ring-2 focus:ring-[#174EA6]"
              />
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[0.6875rem] text-slate-500">
            Last Updated: {currentInstitution?.updatedAt ? new Date(currentInstitution.updatedAt).toLocaleString() : 'N/A'}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={!hasChanges}
              onClick={() => {
                setFormData(initialData);
                setHasChanges(false);
              }}
            >
              Discard Changes
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!hasChanges || isSaving}
              icon={Save}
              className="font-bold shadow-sm"
            >
              {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
