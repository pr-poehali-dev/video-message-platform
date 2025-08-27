import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 854 },
          height: { ideal: 480 },
          facingMode: 'environment'
        },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    if (!streamRef.current) {
      await startCamera();
    }

    if (streamRef.current) {
      chunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(streamRef.current);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        stopCamera();
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendToTelegram = () => {
    if (videoBlob) {
      // Имитация отправки в Telegram
      setShowSuccessPage(true);
    }
  };

  const resetToRecording = () => {
    setShowSuccessPage(false);
    setVideoBlob(null);
    setRecordedVideoUrl(null);
    chunksRef.current = [];
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, []);

  if (showSuccessPage) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-card border-border p-8 text-center max-w-md w-full">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center neon-glow text-primary">
              <Icon name="Check" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2 neon-text text-primary">
              Ваш контакт успешно отправлен
            </h2>
          </div>
          
          <Button 
            onClick={resetToRecording}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground neon-glow text-secondary"
          >
            Создать новый лид
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-foreground">
      <div className="container mx-auto p-4 h-screen flex flex-col lg:flex-row gap-4">
        
        {/* Левая колонка - Изображение */}
        <div className="flex-1 flex items-center justify-center">
          <Card className="bg-card border-border p-6 w-full max-w-md">
            <div 
              className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => setShowImageModal(true)}
            >
              <img 
                src="/img/2b9cf8b4-26b6-4c50-9d90-810127394611.jpg"
                alt="Продукт"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-center mt-4 text-muted-foreground">
              Нажмите для увеличения
            </p>
          </Card>
        </div>

        {/* Правая колонка - Видео запись */}
        <div className="flex-1 flex flex-col gap-4">
          <Card className="bg-card border-border p-6 flex-1">
            <h2 className="text-2xl font-bold mb-6 text-center neon-text text-primary">
              ВИДЕО РЕКОРДЕР
            </h2>
            
            <div className="video-container mb-6 bg-black rounded-lg overflow-hidden">
              {recordedVideoUrl ? (
                <video
                  src={recordedVideoUrl}
                  controls
                  className="w-full h-64 object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-64 object-cover"
                />
              )}
            </div>

            <div className="space-y-4">
              {!videoBlob ? (
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`${
                      isRecording 
                        ? 'bg-destructive hover:bg-destructive/80 text-destructive-foreground' 
                        : 'bg-primary hover:bg-primary/80 text-primary-foreground neon-glow'
                    } text-primary`}
                  >
                    <Icon name={isRecording ? "Square" : "Circle"} className="mr-2" size={20} />
                    {isRecording ? 'Остановить запись' : 'Начать запись'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={sendToTelegram}
                    className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground neon-glow text-secondary"
                  >
                    <Icon name="Send" className="mr-2" size={20} />
                    Отправить в Telegram
                  </Button>
                  
                  <Button
                    onClick={resetToRecording}
                    variant="outline"
                    className="w-full border-border text-muted-foreground hover:text-foreground"
                  >
                    <Icon name="RotateCcw" className="mr-2" size={20} />
                    Записать заново
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-muted/20 rounded-lg">
              <h3 className="font-semibold mb-2 text-sm text-muted-foreground">НАСТРОЙКИ ЗАПИСИ</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Качество:</span>
                  <span className="text-primary">480p HD</span>
                </div>
                <div className="flex justify-between">
                  <span>Камера:</span>
                  <span className="text-primary">Тыловая</span>
                </div>
                <div className="flex justify-between">
                  <span>Телеграм:</span>
                  <span className="text-secondary">Готов к отправке</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Модальное окно для увеличенного изображения */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] bg-black/95 border-border">
          <div className="relative">
            <img 
              src="/img/2b9cf8b4-26b6-4c50-9d90-810127394611.jpg"
              alt="Увеличенное изображение"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <Button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white border-none neon-glow text-primary"
              size="sm"
            >
              <Icon name="X" size={20} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;