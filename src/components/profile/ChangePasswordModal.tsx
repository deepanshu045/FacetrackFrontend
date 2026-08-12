import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";

interface PasswordState {
  current: string;
  next: string;
  confirm: string;
}

interface ChangePasswordModalProps {
  open: boolean;
  password: PasswordState;
  setPassword: React.Dispatch<
    React.SetStateAction<PasswordState>
  >;
  onClose: () => void;
  onSave: () => void;
}

export default function ChangePasswordModal({
  open,
  password,
  setPassword,
  onClose,
  onSave,
}: ChangePasswordModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change Password"
    >
      <div className="space-y-4">
        <Input
          label="Current Password"
          type="password"
          value={password.current}
          onChange={(e) =>
            setPassword((p) => ({
              ...p,
              current: e.target.value,
            }))
          }
        />

        <Input
          label="New Password"
          type="password"
          value={password.next}
          onChange={(e) =>
            setPassword((p) => ({
              ...p,
              next: e.target.value,
            }))
          }
        />

        <Input
          label="Confirm Password"
          type="password"
          value={password.confirm}
          onChange={(e) =>
            setPassword((p) => ({
              ...p,
              confirm: e.target.value,
            }))
          }
        />

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            className="flex-1 justify-center"
            onClick={onSave}
          >
            Update Password
          </Button>
        </div>
      </div>
    </Modal>
  );
}