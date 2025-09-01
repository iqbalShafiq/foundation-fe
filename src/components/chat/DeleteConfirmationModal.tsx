import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Modal, Button } from '../ui';
import { Conversation } from '../../types/chat';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  conversation: Conversation | null;
  isDeleting: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  conversation,
  isDeleting
}) => {
  if (!conversation) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Conversation" size="sm">
      <div className="space-y-6">
        {/* Warning Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>

        {/* Warning Message */}
        <div className="text-center space-y-2">
          <p className="text-gray-100 text-lg font-semibold">Are you sure?</p>
          <p className="text-gray-400">
            This will permanently delete the conversation "<span className="text-gray-100 font-medium">{conversation.title}</span>" and all its messages.
          </p>
          <p className="text-red-400 text-sm font-medium">This action cannot be undone.</p>
        </div>

        {/* Conversation Info */}
        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Model:</span>
              <span className="text-gray-200">{conversation.model_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Messages:</span>
              <span className="text-gray-200">{conversation.message_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Created:</span>
              <span className="text-gray-200">
                {new Date(conversation.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onConfirm}
            className="flex-1 !bg-red-600 hover:!bg-red-700 !border-red-600 hover:!border-red-700 !text-white focus:!ring-red-500"
            loading={isDeleting}
            icon={Trash2}
            iconPosition="left"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;