import { useState } from 'react';
import { Upload, Button, message, Card, Typography, Space, Image } from 'antd';
import { UploadOutlined, PictureOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { authAPI } from '../features/auth/authAPI';

const { Title, Text } = Typography;

const UploadPage = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageId, setImageId] = useState(null);

  const handleUpload = async (file) => {
    setLoading(true);
    try {
      const response = await authAPI.uploadImage(file);
      
      // Получаем ID из заголовков (если бэкенд возвращает X-Image-Id)
      const id = response.headers?.['x-image-id'] || 'N/A';
      
      setUploadedImage(URL.createObjectURL(file));
      setImageId(id);
      message.success('Фото успешно загружено!');
    } catch (error) {
      message.error(error.response?.data?.detail || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
    return false; // Предотвращаем автоматическую загрузку
  };

  const uploadProps = {
    beforeUpload: handleUpload,
    accept: 'image/jpeg,image/png,image/webp',
    maxCount: 1,
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>Загрузка фото</Title>
      
      <Card style={{ marginBottom: 24 }}>
        <Upload.Dragger {...uploadProps} showUploadList={false}>
          <Space direction="vertical" size="large">
            <PictureOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Typography.Paragraph>
              <Text strong>Нажмите или перетащите файл</Text>
            </Typography.Paragraph>
            <Typography.Text type="secondary">
              Поддерживаемые форматы: JPEG, PNG, 
            </Typography.Text>
          </Space>
        </Upload.Dragger>
      </Card>
    </div>
  );
};

export default UploadPage;