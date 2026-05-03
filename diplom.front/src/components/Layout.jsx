import { Layout as AntLayout, Menu, Button, theme } from "antd";
import { UploadOutlined, LogoutOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";

const { Header, Content, Footer } = AntLayout;

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const login = localStorage.getItem("login");
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: "/upload",
      label: "Загрузка фото",
    },
    {
      key: "/history",
      label: "История",
    },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          background: colorBgContainer,
          padding: "0 24px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: "20px", fontWeight: "bold", color: "#1890ff" }}>
          Реставратор
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, justifyContent: "flex-end" }}>
          <Menu
            theme="light"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ 
              flex: 1, 
              borderBottom: "none",
              justifyContent: "flex-end",
              minWidth: "auto"
            }}
          />
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ fontSize: 16 }}
          >
            {login ?? "Выход"}
          </Button>
        </div>
      </Header>
      <Content style={{ padding: "24px", background: colorBgContainer }}>
        <div
          style={{
            padding: 24,
            minHeight: 500,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </div>
      </Content>
      <Footer style={{ textAlign: "center" }}>
        Реставратор ©{new Date().getFullYear()}
      </Footer>
    </AntLayout>
  );
};

export default Layout;