import Navbar from '../components/navbar';

const MainLayout = ({ children }) => {
  return (
    <div className="pattern">
      <div className="wrapper">
        <Navbar />
        {children}
      </div>
    </div>
  );
};

export default MainLayout;