import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function BankSetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [banks, setBanks] = useState<any[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [verifying, setVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('nomba-proxy', {
        body: { action: 'banks' }
      });
      if (error) throw error;
      if (data?.data) {
        setBanks(data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load supported banks');
    } finally {
      setLoadingBanks(false);
    }
  };

  const handleVerify = async () => {
    if (accountNumber.length !== 10) {
      toast.error('Account number must be 10 digits');
      return;
    }
    if (!selectedBankCode) {
      toast.error('Please select a bank');
      return;
    }

    setVerifying(true);
    setVerifiedName(null);
    try {
      const { data, error } = await supabase.functions.invoke('nomba-proxy', {
        body: { action: 'lookup', accountNumber, bankCode: selectedBankCode }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.data?.accountName) {
        setVerifiedName(data.data.accountName);
        toast.success('Account verified!');
      } else {
        throw new Error('Could not verify account name');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to verify account');
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!verifiedName || !selectedBankCode || !accountNumber) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const bankName = banks.find(b => b.code === selectedBankCode)?.name || 'Unknown Bank';

      const { error } = await supabase.from('users').update({
        bank_account_number: accountNumber,
        bank_code: selectedBankCode,
        bank_name: bankName,
        bank_account_name: verifiedName
      }).eq('id', user.id);

      if (error) throw error;

      toast.success('Bank account linked successfully');
      
      if (redirect === 'withdraw') {
        navigate('/withdraw/amount');
      } else {
        navigate(-1);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#101415] text-[#e0e3e5] min-h-screen font-body-md overflow-x-hidden selection:bg-[#b76dff] selection:text-white pb-10">
      
      <header className="sticky top-0 w-full z-50 backdrop-blur-[40px] bg-[#101415]/80 border-b border-white/5">
        <div className="flex items-center px-5 h-16 w-full max-w-[600px] mx-auto gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="material-symbols-outlined text-[#cfc2d6] hover:bg-[#323537] transition-colors p-2 rounded-full active:scale-95 duration-100 -ml-2"
          >
            arrow_back
          </button>
          <h1 className="font-headline-sm text-lg font-bold">Link Bank Account</h1>
        </div>
      </header>

      <main className="max-w-[600px] mx-auto px-5 py-6 space-y-6">
        
        <div className="text-center space-y-2 py-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px] text-primary">account_balance</span>
          </div>
          <h2 className="font-headline-md text-2xl font-bold text-white tracking-tight">Add Bank Details</h2>
          <p className="font-body-sm text-on-surface-variant/80">
            Link a Nigerian bank account to withdraw your funds or receive automatic payouts.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="font-label-lg font-bold text-on-surface-variant/80 px-1 text-sm">Account Number</label>
            <input 
              type="text" 
              maxLength={10}
              placeholder="e.g. 0123456789"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value.replace(/[^0-9]/g, ''));
                setVerifiedName(null);
              }}
              className="w-full bg-surface-container-highest border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-body-lg"
            />
          </div>

          <div className="space-y-2 relative">
            <label className="font-label-lg font-bold text-on-surface-variant/80 px-1 text-sm">Select Bank</label>
            <div className="relative">
              <div 
                onClick={() => {
                  if (!loadingBanks) setDropdownOpen(!dropdownOpen);
                }}
                className={`w-full bg-surface-container-highest border border-white/10 rounded-xl px-4 py-4 text-white flex justify-between items-center cursor-pointer transition-all ${loadingBanks ? 'opacity-50 cursor-not-allowed' : ''} ${dropdownOpen ? 'ring-1 ring-primary/50 border-primary/50' : ''}`}
              >
                <span className={`font-body-lg ${!selectedBankCode ? 'text-on-surface-variant/40' : ''}`}>
                  {selectedBankCode ? banks.find(b => b.code === selectedBankCode)?.name : 'Choose your bank...'}
                </span>
                <span className="material-symbols-outlined text-on-surface-variant/60">
                  {dropdownOpen ? 'expand_less' : 'expand_more'}
                </span>
              </div>

              {dropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-surface-container-highest/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-white/5">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-sm">search</span>
                      <input 
                        type="text" 
                        placeholder="Search banks..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {banks.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                      <div className="p-4 text-center text-sm text-on-surface-variant/60">No banks found</div>
                    ) : (
                      banks.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase())).map((b) => (
                        <div 
                          key={b.code} 
                          onClick={() => {
                            setSelectedBankCode(b.code);
                            setVerifiedName(null);
                            setDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className={`px-4 py-3 text-sm cursor-pointer hover:bg-white/5 transition-colors ${selectedBankCode === b.code ? 'text-primary font-bold bg-primary/5' : 'text-white'}`}
                        >
                          {b.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {verifiedName && (
          <div className="p-4 rounded-xl bg-[#005236]/20 border border-[#005236]/50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="material-symbols-outlined text-[#6ffbbe]">verified</span>
            <div>
              <p className="font-label-sm text-[#6ffbbe]/80 uppercase tracking-widest text-[10px]">Verified Account Name</p>
              <p className="font-body-md font-bold text-white mt-0.5">{verifiedName}</p>
            </div>
          </div>
        )}

      </main>

      <div className="fixed bottom-0 left-0 w-full p-5 bg-[#101415]/90 backdrop-blur-xl border-t border-white/5 z-40">
        <div className="max-w-[600px] mx-auto">
          {!verifiedName ? (
            <button 
              onClick={handleVerify}
              disabled={verifying || accountNumber.length !== 10 || !selectedBankCode}
              className="w-full font-bold py-4 rounded-xl bg-white text-[#101415] hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verifying ? (
                <div className="w-5 h-5 border-2 border-[#101415] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Verify Account'
              )}
            </button>
          ) : (
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full font-bold py-4 rounded-xl bg-gradient-to-r from-primary to-[#b76dff] text-white hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : redirect === 'withdraw' ? 'Save & Continue to Withdraw' : 'Link Bank Account'}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
