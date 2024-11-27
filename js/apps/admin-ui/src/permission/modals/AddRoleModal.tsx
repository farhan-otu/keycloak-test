import React, { useState } from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Form,
  FormGroup,
  TextInput,
  Checkbox,
  TextArea,
} from '@patternfly/react-core';
import { useAdminClient } from "../../admin-client";

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onSubmit: (formData: { name: string; description: string;  }) => void;
  selectedClientId: string | null;
  onSubmit: (formData: { name: string; description: string }) => void;

}
const AddRoleModal: React.FC<AddRoleModalProps> = ({ isOpen, onClose, selectedClientId, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const { adminClient } = useAdminClient();

  const handleTextInputChange = (event: React.FormEvent<HTMLInputElement>, value: string) => {
    const { name } = event.currentTarget;
    console.log(name)
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // const handleSubmit = () => {
  //   onSubmit(formData);
  //   onClose();
  // };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title="Create Permission"
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        <Button key="confirm" variant="primary" onClick={handleSubmit}>
          Submit
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>,
      ]}
    >
      <Form>
        <FormGroup label="Role Name" fieldId="permission-name">
          <TextInput
            value={formData.name}
            onChange={(event, value) => handleTextInputChange(event, value)}
            name="name"
            id="permission-name"
            isRequired
          />
        </FormGroup>
        <FormGroup label="Role Description" fieldId="permission-description">
          <TextArea
            value={formData.description}
            onChange={handleTextAreaChange}
            name="description"
            id="permission-description"
            isRequired
          />
        </FormGroup>
      </Form>
    </Modal>
  );
};

export default AddRoleModal;
