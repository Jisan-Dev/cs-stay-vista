import PropTypes from 'prop-types';
import UpdateUserModal from '../../Modal/UpdateUserModal';
import { useState } from 'react';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import { useMutation } from '@tanstack/react-query';
import useToast from '../../../hooks/useToast';
import useAuth from '../../../hooks/useAuth';

const UserDataRow = ({ user, refetch }) => {
  const [successToast, errorToast] = useToast();
  const axiosSecure = useAxiosSecure();
  const { user: loggedInUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const { mutateAsync } = useMutation({
    mutationFn: async (updateUser) => {
      const { data } = await axiosSecure.patch(`/users/update/${user?.email}`, updateUser);
      return data;
    },
    onSuccess: (data) => {
      refetch();
      console.log(data);
      successToast('User role updated successfully!');
      setIsOpen(false);
    },
  });

  const modalHandler = async (selected) => {
    if (loggedInUser?.email === user?.email) {
      errorToast('Action Not Allowed!');
      setIsOpen(false);
      return;
    }

    const updateUser = {
      role: selected,
      status: 'Verified',
    };

    try {
      await mutateAsync(updateUser);
    } catch (err) {
      console.log(err);
      errorToast(err.message);
    }
  };

  return (
    <tr>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <p className="text-gray-900 whitespace-no-wrap">{user?.email}</p>
      </td>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <p className="text-gray-900 whitespace-no-wrap capitalize">{user?.role}</p>
      </td>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        {user?.status ? (
          <p className={`${user.status === 'Verified' ? 'text-green-500' : 'text-yellow-500'} whitespace-no-wrap`}>{user.status}</p>
        ) : (
          <p className="text-red-500 whitespace-no-wrap">Unavailable</p>
        )}
      </td>

      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <button onClick={() => setIsOpen(true)} className="relative cursor-pointer inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
          <span aria-hidden="true" className="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span>
          <span className="relative">Update Role</span>
        </button>
        {/* Update User Modal */}
        <UpdateUserModal user={user} isOpen={isOpen} setIsOpen={setIsOpen} modalHandler={modalHandler} />
      </td>
    </tr>
  );
};

UserDataRow.propTypes = {
  user: PropTypes.object,
  refetch: PropTypes.func,
};

export default UserDataRow;
