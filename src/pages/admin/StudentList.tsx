import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/layout/AdminSidebar';
import { formatDate } from '../../lib/utils';
import { Profile } from '../../types/database.types';

export const StudentList: React.FC = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      setStudents((data as Profile[]) || []);
    } catch (err) {
      console.error('Error loading students roster:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-sans flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-stack-md lg:p-stack-lg overflow-y-auto max-w-container-max">
        <div className="mb-stack-lg">
          <h1 className="text-headline-lg font-headline-lg text-primary">Student Database Roster</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Registered university student profiles and academic info.
          </p>
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
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Register Number</th>
                    <th className="py-3.5 px-4">College Email</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Year of Study</th>
                    <th className="py-3.5 px-4">Account Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {students.map((std) => (
                    <tr key={std.id} className="hover:bg-surface-container-low/50">
                      <td className="py-3.5 px-4 font-semibold text-primary">{std.full_name}</td>
                      <td className="py-3.5 px-4 font-mono">{std.register_number}</td>
                      <td className="py-3.5 px-4">{std.email}</td>
                      <td className="py-3.5 px-4">{std.department}</td>
                      <td className="py-3.5 px-4 font-semibold">Year {std.year}</td>
                      <td className="py-3.5 px-4">{formatDate(std.created_at)}</td>
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
