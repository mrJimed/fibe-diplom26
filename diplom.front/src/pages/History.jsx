import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Image,
  Button,
  Modal,
  message,
  Spin,
  Typography,
  Tag,
  Empty,
  Space,
  Popconfirm
} from 'antd';
import {
  DeleteOutlined,
  HistoryOutlined,
  ReloadOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

const { Title, Text } = Typography;

const HistoryPage = () => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // Получение истории
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/images/history', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setHistory(response.data.history);
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
      message.error('Не удалось загрузить историю');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Удаление записи
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/images/history/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      message.success('Реставрация удалена');
      fetchHistory();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      message.error('Не удалось удалить');
    }
  };

  // Просмотр изображения
  const handlePreview = (image, title) => {
    setPreviewImage(image);
    setPreviewTitle(title);
    setPreviewVisible(true);
  };

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Заголовок */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <HistoryOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
              <Title level={2} style={{ margin: 0 }}>История реставраций</Title>
            </Space>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={fetchHistory} 
              loading={loading}
            >
              Обновить
            </Button>
          </div>

          {/* Контент */}
          <Spin spinning={loading}>
            {history.length === 0 ? (
              <Empty 
                description="У вас пока нет реставраций"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {history.map((item, idx) => (
                  <Card 
                    key={item.id}
                    size="small"
                    title={
                      <Space>
                        {/* <Tag color="blue">#{idx + 1}</Tag> */}
                        <ClockCircleOutlined />
                        <Text type="secondary">
                          {dayjs(item.date).format('DD.MM.YYYY HH:mm')}
                        </Text>
                      </Space>
                    }
                  >
                    <Row gutter={[16, 16]} justify="center">
                      {/* Оригинал */}
                      <Col xs={24} md={11}>
                        <Card size="small" title="Оригинал" variant="borderless">
                          {item.original_image ? (
                            <img
                              src={`data:image/jpeg;base64,${item.original_image}`}
                              alt="Оригинал"
                              style={{
                                width: "100%",
                                maxHeight: 400,
                                objectFit: "contain",
                                borderRadius: 8,
                                cursor: "pointer"
                              }}
                              onClick={() => handlePreview(
                                `data:image/jpeg;base64,${item.original_image}`, 
                                'Оригинал'
                              )}
                            />
                          ) : (
                            <div
                              style={{
                                height: 300,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#999",
                                background: "#f5f5f5",
                                borderRadius: 8
                              }}
                            >
                              Нет оригинала
                            </div>
                          )}
                        </Card>
                      </Col>

                      {/* Реставрация */}
                      <Col xs={24} md={11}>
                        <Card size="small" title="После реставрации" variant="borderless">
                          <img
                            src={`data:image/jpeg;base64,${item.restored_image}`}
                            alt="Реставрация"
                            style={{
                              width: "100%",
                              maxHeight: 400,
                              objectFit: "contain",
                              borderRadius: 8,
                              cursor: "pointer",
                            }}
                            onClick={() => handlePreview(
                              `data:image/jpeg;base64,${item.restored_image}`, 
                              'Реставрация'
                            )}
                          />
                        </Card>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            )}
          </Spin>
        </Space>
      </Card>

      {/* Модальное окно для просмотра */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="auto"
        style={{ textAlign: 'center' }}
        centered
      >
        <img
          alt={previewTitle}
          src={previewImage}
          style={{ maxWidth: '100%', maxHeight: '80vh' }}
        />
      </Modal>
    </div>
  );
};

export default HistoryPage;