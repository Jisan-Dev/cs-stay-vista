import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import useAuth from '../../hooks/useAuth';
import axios from 'axios';
import { TbFidgetSpinner } from 'react-icons/tb';
// import { imageUpload } from '../../api/utils/imageUpload';
import useToast from '../../hooks/useToast';

const SignUp = () => {
  const { createUser, loading, setLoading, updateUserProfile, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [successToast, errorToast] = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const formData = Object.fromEntries(form.entries());
    // formData.image = e.target.image.files[0];
    const imgFormData = new FormData();
    imgFormData.append('file', formData.image);
    imgFormData.append('upload_preset', 'ssvmfwvn');
    imgFormData.append('cloud_name', 'dijckl5ab');

    try {
      setLoading(true);
      // 1. Upload image and get image url
      // (imgbb)
      // const image_url = await imageUpload(formData.image);

      // (cloudinary)
      const { data } = await axios.post('https://api.cloudinary.com/v1_1/dijckl5ab/image/upload', imgFormData);
      const image_url = data.url;

      //2. User Registration
      const result = await createUser(formData.email, formData.password);
      console.log(result);

      // 3. Save username and photo in firebase
      await updateUserProfile(formData.name, image_url);
      successToast('Successfully signed up');
      navigate('/');
    } catch (error) {
      console.log(error);
      setLoading(false);
      errorToast(error.code || error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      console.log(result);
      successToast('Successfully signed up');
      navigate('/');
    } catch (error) {
      console.log(error);
      setLoading(false);
      errorToast(error.code || error.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="flex flex-col max-w-md p-6 rounded-md sm:p-10 bg-gray-100 text-gray-900">
        <div className="mb-8 text-center">
          <h1 className="my-3 text-4xl font-bold">Sign Up</h1>
          <p className="text-sm text-gray-400">Welcome to StayVista</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-2 text-sm">
                Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                placeholder="Enter Your Name Here"
                className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-rose-500 bg-gray-200 text-gray-900"
                data-temp-mail-org="0"
              />
            </div>
            <div>
              <label htmlFor="image" className="block mb-2 text-sm">
                Select Image:
              </label>
              <input required type="file" multiple="multiple" id="image" name="image" accept="image/*" />
            </div>
            <div>
              <label htmlFor="email" className="block mb-2 text-sm">
                Email address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                placeholder="Enter Your Email Here"
                className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-rose-500 bg-gray-200 text-gray-900"
                data-temp-mail-org="0"
              />
            </div>
            <div>
              <div className="flex justify-between">
                <label htmlFor="password" className="text-sm mb-2">
                  Password
                </label>
              </div>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                id="password"
                required
                placeholder="*******"
                className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-rose-500 bg-gray-200 text-gray-900"
              />
            </div>
          </div>

          <div>
            <button disabled={loading} type="submit" className="bg-rose-500 w-full rounded-md py-3 text-white">
              {loading ? <TbFidgetSpinner className="animate-spin m-auto" /> : 'Continue'}
            </button>
          </div>
        </form>
        <div className="flex items-center pt-4 space-x-1">
          <div className="flex-1 h-px sm:w-16 dark:bg-gray-700"></div>
          <p className="px-3 text-sm dark:text-gray-400">Signup with social accounts</p>
          <div className="flex-1 h-px sm:w-16 dark:bg-gray-700"></div>
        </div>
        <button disabled={loading} onClick={handleGoogleSignIn} className="flex justify-center items-center space-x-2 border m-3 p-2 border-gray-300 border-rounded cursor-pointer">
          <FcGoogle size={32} />

          <p>Continue with Google</p>
        </button>
        <p className="px-6 text-sm text-center text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="hover:underline hover:text-rose-500 text-gray-600">
            Login
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default SignUp;
