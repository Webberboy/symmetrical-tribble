import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to signin page by default
    navigate("/signin", { replace: true });
  }, [navigate]);

  return null;


};

export default Auth;
