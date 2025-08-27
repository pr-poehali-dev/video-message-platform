import React, { useState, useRef } from 'react';
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
  const [cameraStarted, setCameraStarted] = useState(false);

  
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
      setCameraStarted(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
      alert('Не удалось получить доступ к камере');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setCameraStarted(false);
    }
  };

  const startRecording = async () => {
    if (!cameraStarted) {
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

  const shareVideo = async () => {
    if (videoBlob) {
      try {
        // Используем Web Share API если доступен
        if (navigator.share && navigator.canShare) {
          const file = new File([videoBlob], 'video_recording.webm', { type: 'video/webm' });
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Видео запись',
              text: 'Мое видео'
            });
            setShowSuccessPage(true);
          } else {
            // Если Web Share API не поддерживает файлы, скачиваем видео
            downloadVideo();
          }
        } else {
          // Если Web Share API недоступен, скачиваем видео
          downloadVideo();
        }
      } catch (error) {
        console.error('Ошибка при шеринге видео:', error);
        // В случае ошибки скачиваем видео
        downloadVideo();
      }
    }
  };



  const downloadVideo = () => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'video_recording.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShowSuccessPage(true);
    }
  };

  const resetToRecording = () => {
    setShowSuccessPage(false);
    setVideoBlob(null);
    setRecordedVideoUrl(null);
    chunksRef.current = [];
  };



  if (showSuccessPage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="bg-card border-border p-8 text-center max-w-md w-full minimal-shadow">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
              <Icon name="Check" size={32} className="text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-medium text-foreground mb-2">
              Видео успешно обработано
            </h2>
          </div>
          
          <Button 
            onClick={resetToRecording}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Записать новое видео
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 h-screen flex flex-col lg:flex-row gap-8 max-w-6xl">
        
        {/* Левая колонка - QR код */}
        <div className="flex-1 flex items-center justify-center">
          <Card className="bg-card border-border p-8 w-full max-w-md minimal-shadow">
            <div 
              className="qr-container aspect-square cursor-pointer hover:scale-105 transition-transform duration-200"
              onClick={() => setShowImageModal(true)}
            >
              <img 
                src="https://cdn.poehali.dev/files/caf148b2-42ee-493a-9b6e-7ea78d766f46.jpeg"
                alt="QR код для связи"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-center mt-4 text-muted-foreground text-sm">
              Нажмите для увеличения
            </p>
          </Card>
        </div>

        {/* Правая колонка - Видео запись */}
        <div className="flex-1 flex flex-col">
          <Card className="bg-card border-border p-8 flex-1 minimal-shadow">
            <h1 className="text-3xl font-light text-center mb-8 text-foreground">
              Видео запись
            </h1>
            
            <div className="video-container mb-6 bg-muted/20 rounded-lg overflow-hidden">
              {recordedVideoUrl ? (
                <video
                  src={recordedVideoUrl}
                  controls
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center bg-muted/10">
                  {cameraStarted ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Icon name="Video" size={48} className="mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Нажмите кнопку для начала записи</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {!videoBlob ? (
                <div className="flex justify-center">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    size="lg"
                    className={`${
                      isRecording 
                        ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    } px-8`}
                  >
                    <Icon name={isRecording ? "Square" : "Circle"} className="mr-2" size={20} />
                    {isRecording ? 'Остановить запись' : 'Начать запись'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={shareVideo}
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Icon name="Share" className="mr-2" size={20} />
                    Решение
                  </Button>
                  
                  <Button
                    onClick={resetToRecording}
                    variant="outline"
                    size="lg"
                    className="w-full border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  >
                    <Icon name="RotateCcw" className="mr-2" size={20} />
                    Записать заново
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-8 p-4 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div className="text-center">
                  <div className="font-medium text-foreground mb-1">Качество</div>
                  <div>480p HD</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-foreground mb-1">Камера</div>
                  <div>Тыловая</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Модальное окно для увеличенного QR */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-2xl bg-background border-border">
          <div className="qr-container">
            <img 
              src="https://cdn.poehali.dev/files/caf148b2-42ee-493a-9b6e-7ea78d766f46.jpeg"
              alt="QR код для связи"
              className="w-full h-auto object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};



export default Index;