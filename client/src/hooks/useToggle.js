import { useState } from 'react';

const useToggle = (bool) => {
  const [hookToggle, setHookToggle] = useState(bool);
  console.log(hookToggle);
  return [hookToggle, setHookToggle]; // Return current state and function to toggle state
};

export default useToggle;
