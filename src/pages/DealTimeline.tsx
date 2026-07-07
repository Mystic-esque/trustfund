import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import BuyerTimeline from '../components/timeline/BuyerTimeline';
import VendorTimeline from '../components/timeline/VendorTimeline';
import DisputeCenter from '../components/timeline/DisputeCenter';
import TerminalState from '../components/timeline/TerminalState';

const DealTimeline = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/signin');
          return;
        }
        setCurrentUser(user);

        if (!id) {
          setError("Invalid order ID");
          return;
        }

        const { data: orderData, error: orderError } = await supabase
          .from('order_details_view')
          .select('*')
          .eq('id', id)
          .single();

        if (orderError) throw orderError;
        
        if (!orderData) {
          setError("Order not found");
          return;
        }

        // Verify the user is either the buyer or the vendor
        if (orderData.buyer_id !== user.id && orderData.vendor_id !== user.id) {
          setError("You do not have permission to view this deal.");
          return;
        }

        setOrder(orderData);
      } catch (err: any) {
        setError(err.message || 'Failed to load deal details');
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineData();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined text-error text-5xl mb-4">error</span>
        <h2 className="text-xl font-bold text-white mb-2">Oops</h2>
        <p className="text-on-surface-variant mb-6">{error || 'Something went wrong'}</p>
        <button 
          onClick={() => navigate('/orders')}
          className="px-6 py-3 bg-white/10 rounded-full font-bold text-white hover:bg-white/20 transition-all"
        >
          Back to Deals
        </button>
      </div>
    );
  }

  if (order.status === 'DISPUTED') {
    return <DisputeCenter order={order} currentUser={currentUser} />;
  }

  if (['SETTLED', 'REFUNDED', 'EXPIRED'].includes(order.status)) {
    return <TerminalState order={order} currentUser={currentUser} />;
  }

  if (currentUser.id === order.buyer_id) {
    return <BuyerTimeline order={order} currentUser={currentUser} />;
  }

  if (currentUser.id === order.vendor_id) {
    return <VendorTimeline order={order} currentUser={currentUser} />;
  }

  return null;
};

export default DealTimeline;
