import React, { useState, useEffect } from 'react';
import { Modal, ModalVariant, Button, ActionGroup, Form, FormGroup, TextArea, Tabs, Tab, TabTitleText, TabContent, Checkbox } from '@patternfly/react-core';
import Select, { MultiValue, ActionMeta } from 'react-select';
import "../permission.css";
import { useAlerts } from "@keycloak/keycloak-ui-shared";
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { Role } from "../../clients/authorization/policy/Role";
import { MinusCircleIcon } from '@patternfly/react-icons';

interface Role {
  id: string;
  name: string;
}

interface AddRolePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRole: (formData: { name: string; description: string }) => void;
  onSubmitPolicy: (formData: { name: string; description: string; roles: { id: string; required: boolean }[] }) => void;  // Modify to accept roleIds as an array
  roles: Role[];

}

const AddRolePolicyModal: React.FC<AddRolePolicyModalProps> = ({
  isOpen,
  onClose,
  onSubmitRole,
  onSubmitPolicy,
  roles,

}) => {
  const [activeTabKey, setActiveTabKey] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const { addAlert, addError } = useAlerts();
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    roles: { id: string; name: string; required: boolean }[];
  }>({
    name: '',
    description: '',
    roles: [],
  });
  const handleRoleSelect = (selectedRoles: MultiValue<{ value: string; label: string }>, actionMeta: ActionMeta<{ value: string; label: string }>) => {
    const newRoles = selectedRoles.map((role) => ({
      id: role.value,
      name: role.label,
      required: false,
    }));
    setFormData((prevData) => ({
      ...prevData,
      roles: newRoles,
    }));
  };
  const toggleRequired = (roleId: string) => {
    const updatedRoles = formData.roles.map((role) =>
      role.id === roleId ? { ...role, required: !role.required } : role
    );
    setFormData((prevData) => ({
      ...prevData,
      roles: updatedRoles,
    }));
  };
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        roles: [],
      });
      setActiveTabKey(0);
    }
  }, [isOpen]);

  const handleTabClick = (event: React.MouseEvent | React.KeyboardEvent, eventKey: string | number) => {

    const newActiveTabKey = eventKey as number;
    setActiveTabKey(newActiveTabKey);

    if (newActiveTabKey === 1) {

      setFormData((prevData) => ({
        ...prevData,
        name: '',
        description: '',
      }));
    } else if (newActiveTabKey === 0) {

      setFormData((prevData) => ({
        ...prevData,
        roles: [],
        name: '',
        description: '',
      }));
    }
  };
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmitRole = () => {
    if (formData.name && formData.description) {

      onSubmitRole({ name: formData.name, description: formData.description });
      setFormData({
        name: '',
        description: '',
        roles: [],
      });

    }
    else {
      addError("Please Fill all field .", "")
    }
  };

  const handleSubmitPolicy = () => {
    if (formData.description && formData.roles.length > 0) {
      onSubmitPolicy({
        name: formData.name,
        description: formData.description,
        roles: formData.roles.map(role => ({
          id: role.id,
          required: role.required
        }))
      });

      setFormData({
        name: '',
        description: '',
        roles: [],
      });

      onClose();
    } else {
      addError("Please fill all fields. At least one role is required to submit the policy.", "");
      console.error("At least one role is required to submit the policy.");
    }
  };

  return (
    <Modal
      className='pf-v5-role-policy-md'
      variant={ModalVariant.medium}
      title={activeTabKey === 0 ? "Create Role" : "Create Policy"}
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        activeTabKey === 0 && (
          <Button
            key="role-submit"
            variant="primary"
            onClick={handleSubmitRole}
            isDisabled={activeTabKey !== 0}
          >
            Submit Role
          </Button>
        ),
        activeTabKey === 1 && (
          <Button
            key="policy-submit"
            variant="primary"
            onClick={handleSubmitPolicy}
            isDisabled={activeTabKey !== 1}
          >
            Submit Policy
          </Button>
        ),
      ]}
    >
      <Tabs activeKey={activeTabKey} onSelect={handleTabClick} isBox>
        <Tab eventKey={0} title={<TabTitleText>Role</TabTitleText>} aria-label="Create Role Tab">
          <TabContent id="role-tab-content">
            <Form>
              <FormGroup label="Role Name" fieldId="role-name" className='pf-v5-u-mt-md'>
                <TextArea
                  value={formData.name}
                  onChange={handleInputChange}
                  name="name"
                  id="role-name"
                  isRequired
                />
              </FormGroup>
              <FormGroup label="Role Description" fieldId="role-description">
                <TextArea
                  value={formData.description}
                  onChange={handleInputChange}
                  name="description"
                  id="role-description"
                  isRequired
                />
              </FormGroup>
            </Form>
          </TabContent>
        </Tab>

        <Tab
          eventKey={1}
          title={<TabTitleText>Policy</TabTitleText>}
          aria-label="Create Policy Tab"
        >
          <TabContent id="policy-tab-content">
            <Form>
              <FormGroup label="Policy Name" fieldId="policy-name" className='pf-v5-u-mt-md'>
                <TextArea
                  value={formData.name}
                  onChange={handleInputChange}
                  name="name"
                  id="policy-name"
                  isRequired
                />
              </FormGroup>
              <FormGroup label="Policy Description" fieldId="policy-description">
                <TextArea
                  value={formData.description}
                  onChange={handleInputChange}
                  name="description"
                  id="policy-description"
                  isRequired
                />
              </FormGroup>

              <FormGroup label="Add Roles" fieldId="policy-role">
                <div className=''>
                  <Select
                    isMulti
                    menuPosition="fixed"
                    className="pf-v5-u-mb-xl pf-v5-u-pb-sm"
                    options={roles.map((role) => ({
                      value: role.id,
                      label: role.name,
                    }))}
                    onChange={handleRoleSelect}
                    placeholder="Select roles"
                    value={formData.roles.map((role) => ({
                      value: role.id,
                      label: role.name,
                    }))}
                    theme={(theme) => ({
                      ...theme,
                      colors: {
                        ...theme.colors,
                        primary: "rgb(247, 124, 26)",
                      },
                    })}
                  />
                </div>
              </FormGroup>
              {formData.roles.length > 0 && (
                <Table variant="compact">
                  <Thead>
                    <Tr>
                      <Th>Role</Th>
                      <Th>Required</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {formData.roles.map((role) => (
                      <Tr key={role.id}>
                        <Td>{role.name}</Td>
                        <Td>
                          <Checkbox
                            id={`checkbox-${role.id}`}
                            isChecked={role.required}
                            onChange={() => toggleRequired(role.id)}
                          />
                        </Td>
                        <Td>
                          <Button
                            variant="link"
                            icon={<MinusCircleIcon />}
                            onClick={() => {
                              setFormData((prevData) => ({
                                ...prevData,
                                roles: prevData.roles.filter((r) => r.id !== role.id),
                              }));
                            }}
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </Form>
          </TabContent>
        </Tab>
      </Tabs>
    </Modal>
  );
};

export default AddRolePolicyModal;
