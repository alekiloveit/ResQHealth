import React, { useState } from 'react';
import {
  UserPlus,
  Phone,
  Trash2,
  Edit2,
  Shield,
  Star,
  Check,
  AlertCircle,
  Plus,
  Clock,
  Mic,
  MessageSquare,
  Send,
  HelpCircle,
  Settings,
} from 'lucide-react';
import { IceProfile, EmergencyContact, CustomSosNumber } from '../../types/health';
import { saveStoredIceProfile, getStoredSosAlertLogs } from '../../utils/storage';

interface EmergencyContactsManagerProps {
  iceProfile: IceProfile;
  onUpdateProfile: (updated: IceProfile) => void;
  onTriggerSos: () => void;
  isVoiceListening: boolean;
  onToggleVoice: () => void;
  voiceKeywords: string[];
}

export const EmergencyContactsManager: React.FC<EmergencyContactsManagerProps> = ({
  iceProfile,
  onUpdateProfile,
  onTriggerSos,
  isVoiceListening,
  onToggleVoice,
  voiceKeywords,
}) => {
  // Contact state
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelationship, setContactRelationship] = useState('Family');
  const [contactChannel, setContactChannel] = useState<'sms' | 'whatsapp' | 'call' | 'both'>('both');
  const [contactNotes, setContactNotes] = useState('');
  const [isPrimaryContact, setIsPrimaryContact] = useState(false);

  // Custom SOS Numbers state
  const [showAddSosNum, setShowAddSosNum] = useState(false);
  const [sosLabel, setSosLabel] = useState('');
  const [sosNumber, setSosNumber] = useState('');
  const [sosDescription, setSosDescription] = useState('');

  // Template edit state
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [templateText, setTemplateText] = useState(iceProfile.customMessageTemplate);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Past logs
  const [showLogs, setShowLogs] = useState(false);
  const alertLogs = getStoredSosAlertLogs();

  const notifyUser = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  // Save / Add Contact
  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;

    let updatedContacts = [...iceProfile.contacts];

    if (editingContactId) {
      updatedContacts = updatedContacts.map((c) =>
        c.id === editingContactId
          ? {
              ...c,
              name: contactName.trim(),
              phone: contactPhone.trim(),
              relationship: contactRelationship,
              channel: contactChannel,
              customNotes: contactNotes.trim(),
              isPrimary: isPrimaryContact,
            }
          : isPrimaryContact
          ? { ...c, isPrimary: false }
          : c
      );
    } else {
      if (isPrimaryContact) {
        updatedContacts = updatedContacts.map((c) => ({ ...c, isPrimary: false }));
      }
      const newContact: EmergencyContact = {
        id: `c-${Date.now()}`,
        name: contactName.trim(),
        phone: contactPhone.trim(),
        relationship: contactRelationship,
        channel: contactChannel,
        customNotes: contactNotes.trim(),
        isPrimary: isPrimaryContact || updatedContacts.length === 0,
      };
      updatedContacts.push(newContact);
    }

    const updated = { ...iceProfile, contacts: updatedContacts };
    saveStoredIceProfile(updated);
    onUpdateProfile(updated);

    // Reset form
    setContactName('');
    setContactPhone('');
    setContactRelationship('Family');
    setContactChannel('both');
    setContactNotes('');
    setIsPrimaryContact(false);
    setShowAddContact(false);
    setEditingContactId(null);
    notifyUser('Emergency contacts updated');
  };

  const handleEditContact = (c: EmergencyContact) => {
    setEditingContactId(c.id);
    setContactName(c.name);
    setContactPhone(c.phone);
    setContactRelationship(c.relationship);
    setContactChannel(c.channel);
    setContactNotes(c.customNotes || '');
    setIsPrimaryContact(c.isPrimary);
    setShowAddContact(true);
  };

  const handleDeleteContact = (id: string) => {
    const updatedContacts = iceProfile.contacts.filter((c) => c.id !== id);
    const updated = { ...iceProfile, contacts: updatedContacts };
    saveStoredIceProfile(updated);
    onUpdateProfile(updated);
    notifyUser('Contact removed');
  };

  const handleSetPrimary = (id: string) => {
    const updatedContacts = iceProfile.contacts.map((c) => ({
      ...c,
      isPrimary: c.id === id,
    }));
    const updated = { ...iceProfile, contacts: updatedContacts };
    saveStoredIceProfile(updated);
    onUpdateProfile(updated);
    notifyUser('Primary emergency contact set');
  };

  // Custom SOS numbers
  const handleAddSosNumber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sosLabel.trim() || !sosNumber.trim()) return;

    const newNum: CustomSosNumber = {
      id: `sos-${Date.now()}`,
      label: sosLabel.trim(),
      number: sosNumber.trim(),
      description: sosDescription.trim(),
      isPrimary: iceProfile.sosNumbers.length === 0,
    };

    const updatedNumbers = [...iceProfile.sosNumbers, newNum];
    const updated = { ...iceProfile, sosNumbers: updatedNumbers };
    saveStoredIceProfile(updated);
    onUpdateProfile(updated);

    setSosLabel('');
    setSosNumber('');
    setSosDescription('');
    setShowAddSosNum(false);
    notifyUser('Custom SOS number added');
  };

  const handleDeleteSosNumber = (id: string) => {
    const updatedNumbers = iceProfile.sosNumbers.filter((n) => n.id !== id);
    const updated = { ...iceProfile, sosNumbers: updatedNumbers };
    saveStoredIceProfile(updated);
    onUpdateProfile(updated);
    notifyUser('SOS number deleted');
  };

  const handleSetPrimarySosNumber = (id: string) => {
    const updatedNumbers = iceProfile.sosNumbers.map((n) => ({
      ...n,
      isPrimary: n.id === id,
    }));
    const updated = { ...iceProfile, sosNumbers: updatedNumbers };
    saveStoredIceProfile(updated);
    onUpdateProfile(updated);
    notifyUser('Default SOS dispatch number updated');
  };

  const handleSaveTemplate = () => {
    const updated = { ...iceProfile, customMessageTemplate: templateText };
    saveStoredIceProfile(updated);
    onUpdateProfile(updated);
    setEditingTemplate(false);
    notifyUser('Alert message template saved');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Toast Notification */}
      {savedNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Emergency Lifeline Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Emergency Contacts & SOS Alerts
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
            Configure designated contacts, add custom local emergency numbers (EMS, Campus Police, Local Clinic), and set up hands-free voice triggers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={onToggleVoice}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              isVoiceListening
                ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Mic className={`w-4 h-4 ${isVoiceListening ? 'animate-bounce' : ''}`} />
            <span>{isVoiceListening ? 'Voice SOS: ACTIVE' : 'Enable Voice SOS'}</span>
          </button>

          <button
            onClick={onTriggerSos}
            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer"
          >
            <Shield className="w-4 h-4" />
            <span>Test SOS Trigger</span>
          </button>
        </div>
      </div>

      {/* Voice Trigger Instruction Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
            <Mic className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-amber-900">
                Hands-Free Voice Alert System
              </h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${isVoiceListening ? 'bg-amber-200 text-amber-900' : 'bg-amber-100 text-amber-700'}`}>
                {isVoiceListening ? 'Actively Listening' : 'Standby'}
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              When Voice SOS is enabled, saying any of these emergency keywords will instantly trigger the alert beacon with your coordinates:
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {voiceKeywords.map((kw) => (
                <span
                  key={kw}
                  className="px-2.5 py-1 bg-white/90 text-amber-900 text-xs font-mono font-medium rounded-lg border border-amber-200 shadow-2xs"
                >
                  "{kw}"
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Emergency Contacts (Left) & Custom SOS Numbers (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: Designated Emergency Contacts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Designated Contacts</h2>
              <p className="text-xs text-slate-500">
                Contacts notified immediately when you trigger SOS ({iceProfile.contacts.length})
              </p>
            </div>
            <button
              onClick={() => {
                setEditingContactId(null);
                setContactName('');
                setContactPhone('');
                setContactRelationship('Family');
                setContactChannel('both');
                setContactNotes('');
                setIsPrimaryContact(false);
                setShowAddContact(true);
              }}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Contact</span>
            </button>
          </div>

          {/* Add / Edit Contact Modal / Form */}
          {showAddContact && (
            <form onSubmit={handleSaveContact} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">
                  {editingContactId ? 'Edit Emergency Contact' : 'New Emergency Contact'}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Sarah Vance"
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Relationship</label>
                  <select
                    value={contactRelationship}
                    onChange={(e) => setContactRelationship(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                    <option value="Physician">Physician / Doctor</option>
                    <option value="Caregiver">Caregiver</option>
                    <option value="Colleague">Colleague</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Preferred Channel</label>
                  <select
                    value={contactChannel}
                    onChange={(e) => setContactChannel(e.target.value as 'sms' | 'whatsapp' | 'call' | 'both')}
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="both">Both SMS & WhatsApp</option>
                    <option value="sms">SMS Text Message</option>
                    <option value="whatsapp">WhatsApp Direct</option>
                    <option value="call">Direct Phone Call</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Special Instructions</label>
                <input
                  type="text"
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  placeholder="e.g. Has medical proxy, keys to apartment"
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="primaryContactCheck"
                  checked={isPrimaryContact}
                  onChange={(e) => setIsPrimaryContact(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="primaryContactCheck" className="text-xs text-slate-700 font-medium">
                  Set as Primary Contact (called first)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 cursor-pointer"
                >
                  {editingContactId ? 'Update Contact' : 'Save Contact'}
                </button>
              </div>
            </form>
          )}

          {/* Contact List */}
          <div className="space-y-3">
            {iceProfile.contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 hover:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{contact.name}</span>
                    <span className="text-xs text-slate-500">· {contact.relationship}</span>
                    {contact.isPrimary && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Star className="w-3 h-3 fill-rose-600 text-rose-600" />
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-slate-700 mt-1">{contact.phone}</p>
                  {contact.customNotes && (
                    <p className="text-xs text-slate-500 mt-0.5 italic">{contact.customNotes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!contact.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(contact.id)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="Set as primary"
                    >
                      Make Primary
                    </button>
                  )}
                  <button
                    onClick={() => handleEditContact(contact)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    title="Edit contact"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Delete contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Custom SOS Numbers Added Manually */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Emergency & SOS Numbers</h2>
              <p className="text-xs text-slate-500">
                Custom national or local dispatch numbers (EMS, Security, Clinic)
              </p>
            </div>
            <button
              onClick={() => setShowAddSosNum(true)}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add SOS Number</span>
            </button>
          </div>

          {/* Add SOS Number Form */}
          {showAddSosNum && (
            <form onSubmit={handleAddSosNumber} className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Add Custom Emergency Number</h4>
                <button
                  type="button"
                  onClick={() => setShowAddSosNum(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Service / Agency Label</label>
                <input
                  type="text"
                  required
                  value={sosLabel}
                  onChange={(e) => setSosLabel(e.target.value)}
                  placeholder="e.g. Campus Public Safety, Poison Control, Local EMS"
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Telephone Number</label>
                <input
                  type="text"
                  required
                  value={sosNumber}
                  onChange={(e) => setSosNumber(e.target.value)}
                  placeholder="e.g. 911, 112, 1-800-222-1222, or local phone"
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={sosDescription}
                  onChange={(e) => setSosDescription(e.target.value)}
                  placeholder="e.g. 24/7 security guard patrol desk"
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSosNum(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 cursor-pointer"
                >
                  Add SOS Number
                </button>
              </div>
            </form>
          )}

          {/* SOS Numbers List */}
          <div className="space-y-3">
            {iceProfile.sosNumbers.map((sos) => (
              <div
                key={sos.id}
                className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 hover:border-slate-300 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${sos.isPrimary ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{sos.label}</span>
                      {sos.isPrimary && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">{sos.number}</p>
                    {sos.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{sos.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`tel:${sos.number}`}
                    className="px-2.5 py-1 text-xs bg-white border border-slate-300 hover:bg-slate-100 rounded-md font-medium text-slate-700 cursor-pointer"
                  >
                    Call
                  </a>
                  {!sos.isPrimary && (
                    <button
                      onClick={() => handleSetPrimarySosNumber(sos.id)}
                      className="text-xs text-slate-500 hover:text-rose-600 px-2 py-1 cursor-pointer"
                      title="Set as default dispatch number"
                    >
                      Make Default
                    </button>
                  )}
                  {iceProfile.sosNumbers.length > 1 && (
                    <button
                      onClick={() => handleDeleteSosNumber(sos.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Delete number"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Message Template & Alert Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Custom Message Template */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Automated Alert Message Template</h3>
              <p className="text-xs text-slate-500">
                Variables {'{name}'} and {'{maps_link}'} are replaced automatically with live GPS coordinates.
              </p>
            </div>
            {!editingTemplate && (
              <button
                onClick={() => setEditingTemplate(true)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {editingTemplate ? (
            <div className="space-y-3">
              <textarea
                rows={4}
                value={templateText}
                onChange={(e) => setTemplateText(e.target.value)}
                className="w-full text-xs font-mono p-3 bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setTemplateText(iceProfile.customMessageTemplate);
                    setEditingTemplate(false);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Save Template
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-mono leading-relaxed">
              {iceProfile.customMessageTemplate}
            </div>
          )}
        </div>

        {/* SOS Alert Audit Logs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Past SOS Alert History</h3>
              <p className="text-xs text-slate-500">
                Timestamped records of alerts triggered on this device ({alertLogs.length})
              </p>
            </div>
          </div>

          {alertLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No emergency alerts have been triggered yet. Use the "Test SOS Trigger" button above to verify.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {alertLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                      {log.triggerMethod.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-600 truncate">
                    Recipients ({log.notifiedContactsCount}): {log.contactNames.join(', ')}
                  </p>
                  {log.mapsUrl && log.mapsUrl !== 'Location unavailable' && (
                    <a
                      href={log.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-600 hover:underline text-[11px] font-mono block truncate"
                    >
                      {log.mapsUrl}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
