import { useState, useEffect, useRef } from "react";
import {
  Upload, Button, message, Card, Typography, Space, Row, Col
} from "antd";
import { PictureOutlined, ArrowRightOutlined, ReloadOutlined } from "@ant-design/icons";
import { authAPI } from "../features/auth/authAPI";

const { Title, Text } = Typography;

const UploadPage = () => {
  const [loading, setLoading] = useState(false);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [restoredUrl, setRestoredUrl] = useState(null);
  const [imageId, setImageId] = useState(null);
  
  // 🔹 Храним ссылки на созданные ObjectURL, чтобы не потерять их
  const urlsRef = useRef({ original: null, restored: null });

  // 🔹 Очистка ТОЛЬКО при размонтировании
  useEffect(() => {
    return () => {
      if (urlsRef.current.original) URL.revokeObjectURL(urlsRef.current.original);
      if (urlsRef.current.restored) URL.revokeObjectURL(urlsRef.current.restored);
    };
  }, []);

const handleUpload = async (file) => {
  setLoading(true);
  try {
    // 🔹 1. Очищаем предыдущие ссылки
    if (urlsRef.current.original) URL.revokeObjectURL(urlsRef.current.original);
    if (urlsRef.current.restored) URL.revokeObjectURL(urlsRef.current.restored);
    
    // 🔹 2. Превью оригинала
    const originalBlob = new Blob([await file.arrayBuffer()], { type: file.type });
    const originalObjectUrl = URL.createObjectURL(originalBlob);
    
    urlsRef.current.original = originalObjectUrl;
    setOriginalUrl(originalObjectUrl);

    // 🔹 3. Запрос к бэкенду
    const response = await authAPI.uploadImage(file);
    
    // 🔹 4. 🔥 ИСПРАВЛЕНО: Правильное извлечение blob
    let restoredBlob;
    
    // Если это axios response (response.data существует)
    if (response && response.data !== undefined) {
      // Если responseType был установлен как 'blob'
      if (response.data instanceof Blob) {
        restoredBlob = response.data;
      }
      // Если responseType был 'arraybuffer'
      else if (response.data instanceof ArrayBuffer) {
        restoredBlob = new Blob([response.data], { type: 'image/jpeg' });
      }
      // Если это бинарные данные в другом формате
      else if (typeof response.data === 'string' || response.data instanceof Uint8Array) {
        restoredBlob = new Blob([response.data], { type: 'image/jpeg' });
      }
    }
    // Если response сам является Blob (от fetch с .blob())
    else if (response instanceof Blob) {
      restoredBlob = response;
    }
    
    // 🔍 Проверка валидности blob
    if (!restoredBlob || restoredBlob.size === 0) {
      throw new Error('Получены пустые данные от сервера');
    }
    
    console.log('📦 Restored blob:', {
      size: restoredBlob.size,
      type: restoredBlob.type,
      valid: restoredBlob.size > 1000
    });
    
    // 🔹 5. Создаём URL для отображения
    const restoredObjectUrl = URL.createObjectURL(restoredBlob);
    urlsRef.current.restored = restoredObjectUrl;
    setRestoredUrl(restoredObjectUrl);
    
    // Получаем imageId из заголовков
    const id = response.headers?.['x-image-id'] || 
               (response.headers?.get && response.headers.get('x-image-id'));
    if (id) setImageId(id);
    
    message.success('Фото обработано! 🎉');
    
  } catch (error) {
    console.error('🔥 Upload error:', error);
    message.error(error.message || 'Ошибка обработки');
  } finally {
    setLoading(false);
  }
  return false;
};

  const handleReset = () => {
    if (urlsRef.current.original) URL.revokeObjectURL(urlsRef.current.original);
    if (urlsRef.current.restored) URL.revokeObjectURL(urlsRef.current.restored);
    
    urlsRef.current = { original: null, restored: null };
    setOriginalUrl(null);
    setRestoredUrl(null);
    setImageId(null);
  };

  const uploadProps = {
    beforeUpload: handleUpload,
    accept: 'image/jpeg,image/png,image.webp,image/gif',
    maxCount: 1,
    showUploadList: false,
    disabled: loading,
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 16px' }}>
      <Title level={2} style={{ textAlign: 'center' }}>Улучшение качества фото</Title>

      {/* 🔹 Показываем, если есть оригинал */}
      {originalUrl && (
        <Space direction="vertical" style={{ width: '100%', marginBottom: 10 }} size="large">
          
          <Row gutter={[16, 16]} justify="center">
            {/* Оригинал */}
            <Col xs={24} md={11}>
              <Card size="small" title="Оригинал" variant="borderless">
                <img
                  key={originalUrl}  // 🔑 Force re-render
                  src={originalUrl}
                  alt="Оригинал"
                  style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 8 }}
                  onLoad={() => console.log('✅ Original loaded')}
                  onError={(e) => console.error('❌ Original error:', e)}
                />
              </Card>
            </Col>
            
            {/* Восстановленное */}
            <Col xs={24} md={11}>
              <Card 
                size="small" 
                title="После реставрации" 
                variant="borderless"
              >
                {restoredUrl ? (
                  <img
                    key={restoredUrl}  // 🔑 Критично для blob-URL!
                    src={restoredUrl}
                    alt="Отреставрированное"
                    style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 8 }}
                    onLoad={() => console.log('✅ Restored loaded')}
                    onError={(e) => {
                      console.error('❌ Restored error event:', e);
                      // 🔍 Доп. проверка: пробуем загрузить blob вручную
                      fetch(restoredUrl)
                        .then(r => r.blob())
                        .then(b => console.log('📦 Manual fetch blob:', b.size, b.type))
                        .catch(err => console.error('🔥 Manual fetch error:', err));
                    }}
                  />
                ) : (
                  <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                    {loading ? 'Обработка...' : 'Ожидание'}
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </Space>
      )}

      {/* Блок загрузки */}
      <Card style={{ marginBottom: 24 }} variant="borderless">
        <Upload.Dragger {...uploadProps}>
          <Space orientation="vertical" size="large">
            <PictureOutlined style={{ fontSize: 48, color: loading ? '#ccc' : '#1890ff' }} />
            <Text strong>{loading ? 'Обработка...' : 'Нажмите или перетащите файл'}</Text>
            <Text type="secondary">Поддерживаемые форматы: JPEG, PNG, WEBP, GIF</Text>
          </Space>
        </Upload.Dragger>
      </Card>
    </div>
  );
};

export default UploadPage;