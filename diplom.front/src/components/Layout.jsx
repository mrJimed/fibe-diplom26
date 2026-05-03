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
      icon: <UploadOutlined />,
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
          Photo Restore
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Menu
            theme="light"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ flex: 1, minWidth: 0, borderBottom: "none" }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "4px 12px",
              backgroundColor: "#fff",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <Button
              type="text"
              size="small"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              iconPosition="end"
              style={{ marginLeft: "8px", fontSize: 16 }}
            >
              {login ?? "Выход"}
            </Button>
          </div>
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
        Photo Restore App ©{new Date().getFullYear()}
      </Footer>
    </AntLayout>
  );
};

export default Layout;
