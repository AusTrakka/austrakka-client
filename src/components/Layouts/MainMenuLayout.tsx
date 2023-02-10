
import { useState } from "react";
import MainMenu from "../Common/MainMenu/MainMenu";
import { Outlet } from 'react-router-dom';

const MainMenuLayout = () => {

  const [pageStyling, updatePageStyling] = useState("pagePadded")

  const handlePadding = (drawer: boolean | undefined) => {
    if (drawer === true) {
      updatePageStyling("pagePadded")
    } else {
      updatePageStyling("page")
    }
  };

  return(
    <>
      <MainMenu handlePadding={handlePadding} />
      <div className={pageStyling}>
        <Outlet/>
      </div>
    </>
  );
};

export default MainMenuLayout;