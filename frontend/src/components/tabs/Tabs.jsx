import { useState } from "react";

const Tabs = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);

  // Guard rendering to avoid undefined access
  if (!tabs || tabs.length === 0) {
    return <div>No tabs available</div>;
  }

  return (
    <div className="m-3">
      <ul className="nav nav-tabs">
        {tabs.map((tab, index) => (
          <li className="nav-item" key={index}>
            <button
              className={`nav-link ${activeTab === index ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="tab-content p-3 mt-2">
        <div className="tab-pane fade show active">
          {tabs[activeTab]?.content || <p>No content available</p>}
        </div>
      </div>
    </div>
  );
};

export default Tabs;
