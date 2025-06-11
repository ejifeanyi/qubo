import { Star } from "lucide-react";
import { trpc } from "../lib/trpc";

interface EmailItemProps {
    email: any; 
  }
  
  const EmailItem: React.FC<EmailItemProps> = ({ email }) => {
    const utils = trpc.useUtils();
    const updateEmailMutation = trpc.gmail.updateEmail.useMutation({
      onSuccess: () => {
        utils.gmail.getEmails.invalidate();
      },
    });
  
    const handleToggleRead = (e: React.MouseEvent) => {
      e.stopPropagation();
      updateEmailMutation.mutate({
        id: email.id,
        isRead: !email.isRead,
      });
    };
  
    const handleToggleStar = (e: React.MouseEvent) => {
      e.stopPropagation();
      updateEmailMutation.mutate({
        id: email.id,
        isStarred: !email.isStarred,
      });
    };
  
    const formatDate = (date: Date) => {
      const now = new Date();
      const emailDate = new Date(date);
      const diffDays = Math.floor((now.getTime() - emailDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return emailDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        });
      } else if (diffDays < 7) {
        return emailDate.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return emailDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    };
  
    return (
      <div
        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
          !email.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
        }`}
      >
        <div className="flex items-start space-x-3">
          {/* Read/Unread Indicator */}
          <button
            onClick={handleToggleRead}
            className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 transition-colors ${
              email.isRead ? 'bg-gray-300 hover:bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          />
  
          {/* Email Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${email.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                  {email.from.includes('<') 
                    ? email.from.split('<')[0].trim().replace(/"/g, '')
                    : email.from
                  }
                </span>
                {email.category && (
                  <span
                    className="px-2 py-1 text-xs rounded-full text-white"
                    style={{ backgroundColor: email.category.color }}
                  >
                    {email.category.name}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {formatDate(email.receivedAt)}
                </span>
                <button
                  onClick={handleToggleStar}
                  className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                    email.isStarred ? 'text-yellow-500' : 'text-gray-400'
                  }`}
                >
                  <Star className={`h-4 w-4 ${email.isStarred ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
            
            <h3 className={`text-sm mb-1 truncate ${
              email.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'
            }`}>
              {email.subject}
            </h3>
            
            <p className="text-sm text-gray-600 truncate">
              {email.snippet}
            </p>
          </div>
        </div>
      </div>
    );
  };
export default EmailItem;