import { playSound } from './sounds';

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

export function showNotification(title: string, body: string, icon?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error("Error showing notification:", error);
  }
}

// Simple scheduler that checks every minute
// In a real app, this would be a Service Worker
export function startNotificationScheduler(habits: any[]) {
  const checkReminders = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    habits.forEach(habit => {
      if (habit.reminderTime === currentTime && !habit.isArchived) {
        playSound('notification');
        showNotification(
          `Aura: ${habit.name}`,
          `Time to complete your protocol!`,
          habit.icon
        );
      }
    });
  };

  const interval = setInterval(checkReminders, 60000); // Check every minute
  return () => clearInterval(interval);
}
