import LoadingSpinner from '../../../components/Shared/LoadingSpinner';
import useRole from '../../../hooks/useRole';
import { useBoolean } from '../../../providers/BooleanProvider';
import AdminStatistics from '../Admin/AdminStatistics';
import GuestStatistics from '../Guest/GuestStatistics';
import HostStatistics from '../Host/HostStatistics';

const Statistics = () => {
  const { booleanState } = useBoolean();
  const [role, isLoading] = useRole();

  if (isLoading) return <LoadingSpinner />;
  return (
    <>
      {role === 'admin' && <AdminStatistics />}
      {/* {role === 'host' && <HostStatistics />} */}
      {role === 'host' ? booleanState ? <HostStatistics /> : <GuestStatistics /> : undefined}
      {role === 'guest' && <GuestStatistics />}
    </>
  );
};

export default Statistics;
