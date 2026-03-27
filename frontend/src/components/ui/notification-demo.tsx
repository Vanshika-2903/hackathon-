import { NotificationCard } from '@/components/ui/card-15';

const NotificationCardDemo = () => {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center bg-background p-4">
      <NotificationCard
        title="Notifications"
        avatarSrc="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2960&auto=format&fit=crop"
        avatarFallback="CH"
        isOnline={true}
        userName="Charlie Herwitz"
        userRole="Product Director"
        message="Would you like them formatted for a specific use case, like a project management tool?"
        timestamp="5 mins"
        readStatus="Read"
        onReply={() => alert('Reply button clicked!')}
      />
    </div>
  );
};

export default NotificationCardDemo;
