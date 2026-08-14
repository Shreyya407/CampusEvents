import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { formatCurrency, formatDate } from '../../lib/utils';

export const FinanceList: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('payments')
        .select(`
          *,
          event:events(*),
          student:profiles(*)
        `)
        .order('paid_at', { ascending: false });

      setPayments(data || []);
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = payments
    .filter((p) => p.payment_status === 'successful')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div className="bg-background text-on-background min-h-screen font-sans flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-stack-md lg:p-stack-lg overflow-y-auto max-w-container-max">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-stack-lg gap-4">
          <div>
            <h1 className="text-headline-lg font-headline-lg text-primary">Finance & Payment Records</h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              Audit transaction history, mock payment reference codes, and event revenues.
            </p>
          </div>

          <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-4 py-2 rounded-xl text-right">
            <p className="text-label-sm font-label-sm uppercase">Total Successful Revenue</p>
            <p className="text-headline-md font-bold">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-body-sm">
                <thead>
                  <tr className="border-b border-outline-variant text-label-sm uppercase text-on-surface-variant bg-surface-container-low">
                    <th className="py-3.5 px-4">Txn Reference</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Event</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Payment Status</th>
                    <th className="py-3.5 px-4">Paid Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-container-low/50">
                      <td className="py-3.5 px-4 font-mono text-secondary font-bold">{p.transaction_reference}</td>
                      <td className="py-3.5 px-4 font-semibold text-primary">{p.student?.full_name}</td>
                      <td className="py-3.5 px-4">{p.event?.title}</td>
                      <td className="py-3.5 px-4 font-bold">{formatCurrency(p.amount)}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-label-sm font-bold uppercase ${
                            p.payment_status === 'successful'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-error-container text-on-error-container'
                          }`}
                        >
                          {p.payment_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{formatDate(p.paid_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
