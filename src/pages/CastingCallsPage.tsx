import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import CastingCallCard from '../components/CastingCallCard';
import CreateCastingCallModal from '../components/CreateCastingCallModal';
import { Loader2, XCircle } from 'lucide-react';

interface CastingCallUser {
  _id: string;
  fullName: string;
  role: string;
  avatar?: string;
}

interface CastingCall {
  _id: string;
  user: CastingCallUser;
  projectTitle: string;
  projectType: string;
  roleDescription: string;
  roleType: string;
  location: string;
  applicationDeadline: string;
  contactEmail: string; // Mark optional if not always returned
}

const CastingCallsPage = () => {
  const [castingCalls, setCastingCalls] = useState<CastingCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { token } = useAuth();

  const fetchCastingCalls = async () => {
    if (!token) {
      setError('You must be logged in to view casting calls.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get<CastingCall[]>('/api/casting-calls', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCastingCalls(response.data);
    } catch (err: unknown) {
      console.error("Failed to fetch casting calls:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load casting calls. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCastingCalls();
  }, [token]);

  const handleCastingCallCreated = () => {
    fetchCastingCalls();
    setIsModalOpen(false);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col">
      <Header />
      <main className="pt-16 flex-grow container mx-auto px-4 flex">
        <LeftSidebar />

        <div className="flex-grow p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Casting Calls</h1>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Post a Casting Call
            </button>
          </div>

          {isLoading ? (
            <p className="text-gray-400 flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin mr-2" /> Loading casting calls...
            </p>
          ) : error ? (
            <p className="text-red-400 flex items-center justify-center py-10">
              <XCircle size={16} className="mr-2" /> {error}
            </p>
          ) : castingCalls.length > 0 ? (
            <div className="space-y-6">
              {castingCalls.map(call => (
                <CastingCallCard key={call._id} call={call} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <p className="text-gray-400">No active casting calls at the moment.</p>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <CreateCastingCallModal 
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleCastingCallCreated}
        />
      )}
    </div>
  );
};

export default CastingCallsPage;
