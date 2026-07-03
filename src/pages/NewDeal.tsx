import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import './NewDeal.css';

const NewDeal = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [timeframe, setTimeframe] = useState('1-3');
  const [agreed, setAgreed] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }
      setUser(user);
      const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (profile) setUserData(profile);
    };
    fetchUser();
  }, [navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const amountVal = parseFloat(amount) || 0;
  const fee = amountVal * 0.015; // 1.5% platform fee
  const net = amountVal - fee;

  const displayTitle = title.trim() || 'New Deal';
  
  const formatMoney = (val: number) => {
    return '₦ ' + val.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleGenerateLink = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const linkSlug = Math.random().toString(36).substring(2, 8).toUpperCase();
      const referenceId = `TF-${new Date().getFullYear()}-${linkSlug}`;

      let itemImageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${linkSlug}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('deal-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('deal-images')
          .getPublicUrl(fileName);
        
        itemImageUrl = publicUrlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('orders')
        .insert({
          link_slug: linkSlug,
          reference_id: referenceId,
          vendor_id: user.id,
          item_name: title.trim(),
          item_description: description.trim(),
          amount: amountVal,
          platform_fee: fee,
          net_payout: net,
          delivery_window: timeframe,
          status: 'PENDING_PAYMENT',
          item_image_url: itemImageUrl
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Deal created successfully!');
      navigate(`/orders/${data.id}/share`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="new-deal-wrapper font-body-md pb-[100px]">
      
      {/* Header */}
      <header className="w-full top-0 sticky z-50 glass-panel-new-deal aetheric-glint-new-deal px-5 py-4 max-w-[600px] mx-auto border-b-0 rounded-b-2xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="material-symbols-outlined text-on-surface hover:opacity-80 active:scale-95 transition-transform"
            >
              arrow_back
            </button>
            <h1 className="text-xl font-bold text-primary">Create New Deal</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-on-surface-variant hover:text-white cursor-pointer">notifications</span>
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10">
              <img alt="Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWTCzjewBwrD5OS7QH0F7ppv_iP0n70vu1vaEnj13NzIrlCX-rk4GsiGqccsdVLJBf9dNWp3Mhp5rbWwhbIrm1YojpfVzbJvxt-WT45iczx-TOBNHcKA_O3zxy1oOH5PjG_I0t-ic7rrMOcY_mG6wsbVDLaiqiHF9hN0Wa3JNyJs6n27Q3FzpU6lJa_aK-RsAa_Bep6YG8UTdMVnGCQz_D28Bg085YEp2lvYPGL2-VC21ffed9NBRIcU0OB7yFZ_RltL7jkt30Hpsx"/>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[600px] mx-auto px-5 mt-6 flex flex-col gap-6">
        
        {/* Form Tile 1: Basic Info */}
        <section className="glass-panel-new-deal rounded-2xl p-5 flex flex-col gap-4">
          {/* Image Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider px-1">Product Image</label>
            <div className="relative w-full h-32 border-2 border-dashed border-white/20 rounded-xl bg-white/5 flex flex-col items-center justify-center hover:bg-white/10 hover:border-primary/50 transition-colors cursor-pointer overflow-hidden">
              {image ? (
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-white/40 text-3xl mb-1">add_photo_alternate</span>
                  <span className="text-sm font-medium text-white/60">Tap to upload</span>
                </>
              )}
              <input 
                type="file" 
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider px-1">Item / Deal Title</label>
            <input 
              className="glass-input-new-deal rounded-xl h-14 px-4 font-medium text-lg w-full bg-transparent" 
              placeholder="e.g. Vintage 90s Nike Jacket" 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider px-1">Item Description</label>
            <textarea 
              className="glass-input-new-deal rounded-xl min-h-[120px] p-4 font-medium leading-relaxed w-full bg-transparent" 
              placeholder="Describe the item condition, size, and inclusions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
        </section>

        {/* Form Tile 2: Value & Timeframe */}
        <section className="glass-panel-new-deal rounded-2xl p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider px-1">Amount (₦)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-lg font-bold">₦</span>
                <input 
                  className="glass-input-new-deal rounded-xl h-14 pl-10 pr-4 w-full font-bold text-xl bg-transparent" 
                  placeholder="0.00" 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider px-1">Fulfillment Timeframe</label>
              <div className="relative">
                <select 
                  className="glass-input-new-deal rounded-xl h-14 px-4 w-full font-medium appearance-none bg-transparent"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                >
                  <option value="1-3" className="text-black">1-3 Days</option>
                  <option value="3-5" className="text-black">3-5 Days</option>
                  <option value="5-7" className="text-black">5-7 Days</option>
                  <option value="7+" className="text-black">7+ Days</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">expand_more</span>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="mt-2 p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant text-sm">Escrow Fee (1.5%)</span>
              <span className="text-white font-medium">{formatMoney(fee)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <span className="text-primary font-semibold">You will receive</span>
              <span className="text-primary font-bold text-lg">{formatMoney(net)}</span>
            </div>
          </div>
        </section>

        {/* Agreement */}
        <section className="px-2 flex items-start gap-4 group">
          <div className="relative inline-flex items-center cursor-pointer mt-1">
            <input 
              className="sr-only peer" 
              id="agree-toggle" 
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <div className="w-12 h-7 bg-white/10 rounded-full peer peer-checked:bg-primary transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
          </div>
          <label className="text-sm text-on-surface-variant leading-snug cursor-pointer select-none" htmlFor="agree-toggle">
            I agree to the TrustFund <Link to="#" className="text-primary underline">Escrow Agreement</Link> and understand that funds will only be released upon verified delivery.
          </label>
        </section>

        {/* Buyer Preview Section */}
        <section className="mt-4">
          <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-4 px-2">Buyer Sees This:</h3>
          <div className="glass-panel-new-deal aetheric-glint-new-deal rounded-2xl p-5 shadow-2xl overflow-hidden">
            <div className="flex gap-4 items-start relative z-10">
              <div className="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                {image ? (
                  <img src={image} alt="Product" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-white/20 text-4xl">image</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                  <span className="text-xs font-semibold text-on-surface-variant">@{userData ? userData.full_name.split(' ').join('_').toLowerCase() : 'vendor_name'}</span>
                </div>
                <h2 className="text-lg font-bold text-white leading-tight mb-2 truncate">{displayTitle}</h2>
                <div className="text-2xl font-bold text-primary">{formatMoney(amountVal)}</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="mt-4 mb-10">
          <button 
            className={`btn-gradient w-full h-16 rounded-2xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-3 ${(!agreed || amountVal <= 0 || !title.trim() || isSubmitting) ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`} 
            disabled={!agreed || amountVal <= 0 || !title.trim() || isSubmitting}
            onClick={handleGenerateLink}
          >
            <span className="material-symbols-outlined">{isSubmitting ? 'hourglass_top' : 'link'}</span>
            {isSubmitting ? 'Creating Deal...' : 'Generate Deal Link'}
          </button>
          <p className="text-center text-xs text-on-surface-variant/50 mt-4 px-10 leading-relaxed font-medium">
            A unique, secure escrow link will be generated for your buyer to pay via bank transfer or card.
          </p>
        </div>

      </main>

      <BottomNav />
    </div>
  );
};

export default NewDeal;
