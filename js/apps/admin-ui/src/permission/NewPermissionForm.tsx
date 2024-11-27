import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { useAdminClient } from "../admin-client";
import { useAlerts } from "@keycloak/keycloak-ui-shared";
import type RoleRepresentation from "@keycloak/keycloak-admin-client/lib/defs/roleRepresentation";
import type ClientRepresentation from "@keycloak/keycloak-admin-client/lib/defs/clientRepresentation";
import AddRoleModal from './modals/AddRoleModal';
import { fetchRolesForClient, createRole, fetchPoliciesForClient, fetchResourcesForClient, fetchScopesForClient, createScopePermission } from "./api/RoleApi";
import type PolicyRepresentation from "@keycloak/keycloak-admin-client/lib/defs/policyRepresentation";
import type ResourceRepresentation from "@keycloak/keycloak-admin-client/lib/defs/resourceRepresentation";
import type ScopeRepresentation from "@keycloak/keycloak-admin-client/lib/defs/scopeRepresentation";
import { PlusIcon } from '@patternfly/react-icons';
import { ArrowRightIcon } from '@patternfly/react-icons';
import { Divider } from '@patternfly/react-core';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import "./permission.css";

const NewPermissionForm: React.FC = () => {
    const { adminClient } = useAdminClient();
    const { t } = useTranslation();
    const { addAlert, addError } = useAlerts();
    // State to store the clients fetched from Keycloak
    const [clients, setClients] = useState<ClientRepresentation[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [roles, setRoles] = useState<RoleRepresentation[]>([]);
    const [policy, setPolicy] = useState<PolicyRepresentation[]>([]);
    const [resource, setResource] = useState<ResourceRepresentation[]>([]);
    const [selectedResources, setSelectedResources] = useState<any[]>([]);
    const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [availableOptions, setAvailableOptions] = useState<ScopeRepresentation[]>([]); // For storing available options
    const [selectedOptions, setSelectedOptions] = useState<ScopeRepresentation[]>([]); // For storing selected options
    // Fetch all clients from Keycloak
    const fetchAllClients = async () => {
        try {
            const fetchedClients = await adminClient.clients.find();
            setClients(fetchedClients); // Set the clients in state
        } catch (error) {
            console.error("Error fetching clients:", error);
            addError("clientFetchError", error);
        }
    };

    useEffect(() => {
        fetchAllClients();
    }, []);

    const handleClientSelect = async (selectedOption: { value: string; label: string } | null) => {
        const selectedClientId = selectedOption ? selectedOption.value : "";
        setSelectedClientId(selectedClientId);
        if (!selectedClientId) {
            addAlert("Please select a client first");
        }
        try {
            setSelectedOptions([]);
            const roles = await fetchRolesForClient(adminClient, selectedClientId);
            setRoles(roles);
            const policy = await fetchPoliciesForClient(adminClient, selectedClientId);
            setPolicy(policy || []);
            const resource = await fetchResourcesForClient(adminClient, selectedClientId);
            setResource(resource);
            const scopes = await fetchScopesForClient(adminClient, selectedClientId);
            setAvailableOptions(scopes);

        } catch (error) {
            addError("Error fetching roles", error);
            console.error("Error fetching roles:", error);
        }
    };

    const handleSubmit = async (formData: { name: string; description: string }) => {
        if (!selectedClientId) {
            return;
        }
        try {
            const newRole = await createRole(adminClient, selectedClientId, formData);
            console.log("Role Created:", newRole);
            setIsModalOpen(false);  // Close the modal after successful creation
        } catch (error) {
            addError("Error creating roles", error)
            console.error("Error creating role:", error);
        }
    };
    const handleRoleSelect = (selectedOption: { value: string; label: string } | null) => {
        if (selectedOption) {
            setSelectedRoleId(selectedOption.value);
        } else {
            setSelectedRoleId(null);
        }
    };
    const handlePolicySelect = (selected: { value: string; label: string | undefined } | null) => {
        if (selected) {
            setSelectedPolicyId(selected.value);
        } else {
            setSelectedPolicyId(null);
        }
    };

    const handleResourceChange = (
        selected: { value: string, label: string } | null
    ) => {
        if (selected) {
            const selectedId = selected.value;
            setSelectedResources([selected]);
        } else {
            setSelectedResources([]);
        }
    };
    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);
    const handleSelect = (option: ScopeRepresentation) => {
        setSelectedOptions((prevSelected) => [...prevSelected, option]);
        setAvailableOptions((prevOptions) =>
            prevOptions.filter((item) => item.id !== option.id)
        );
    };
    const handleRemove = (option: ScopeRepresentation) => {
        setAvailableOptions((prevOptions) => [...prevOptions, option]);
        setSelectedOptions((prevSelected) =>
            prevSelected.filter((item) => item.id !== option.id)
        );
    };
    const loadResources = (inputValue: string) =>
        new Promise<any[]>((resolve) => {
            const filteredOptions = resource
                .filter((resourceItem) =>
                    resourceItem.name?.toLowerCase().includes(inputValue.toLowerCase())
                )
                .map((resourceItem) => ({
                    value: resourceItem._id || 'default-id',
                    label: resourceItem.name || 'Unnamed Resource',
                }));

            setTimeout(() => {
                resolve(filteredOptions);
            }, 1000);
        });

    const handleSaveRoles = async () => {
        try {
            if (!selectedClientId || !selectedRoleId || !selectedPolicyId || !resource.length || !selectedOptions.length) {
                addError("Please select all the necessary fields", "");
                return;
            }
            const selectedResourceIds = selectedResources.map((resourceItem) => resourceItem.value);
            // Validate if there are selected resource IDs
            if (selectedResourceIds.length === 0) {
                addError("Please select at least one resource.", "");
                return;
            }
            const selectedScopeIds = selectedOptions
                .map((option) => option.id)
                .filter((id): id is string => id !== undefined);

            // Check if we have any selected scope IDs
            if (selectedScopeIds.length === 0) {
                alert("Please select at least one scope.");
                return;
            }
            const result = await createScopePermission(
                adminClient,
                selectedClientId,
                selectedPolicyId,
                selectedResourceIds,
                selectedScopeIds
            );

            if (result.response == 201) {
                addAlert("Successfully created scope permission");
            }
            else {
                addError("Failed to create scope permission", result.message)
            }
        } catch (error) {
            addError("Please select all the necessary fields", "");
        }
    };

    return (
        <section className='pf-v5-c-page__main-breadcrumb'>
            <div className="pf-v5-c-main-section">
                <h1 className='pf-v5-c-main-heading'>Create Permission</h1>
                <Divider />
                <div className="pf-v5-c-flex">
                    <label>Select Client</label>
                    <Select
                        className="pf-v5-c__react-select"
                        options={clients.length > 0
                            ? clients.map((client) => ({
                                value: client.id || '',  // Ensure value is a string, fallback to empty string if client.id is undefined
                                label: client.clientId || '',  // Ensure label is a string, fallback to 'Unknown Client' if client.clientId is undefined
                            }))
                            : [{ value: '', label: t("No Clients Found") }]
                        }
                        value={selectedClientId
                            ? { value: selectedClientId, label: clients.find(c => c.id === selectedClientId)?.clientId || '' }
                            : null
                        }
                        onChange={handleClientSelect}
                        placeholder={t("Select Client")}
                        isDisabled={clients.length === 0}
                    />
                </div>
                <div className='pf-v5-c-flex'>
                    <label>Select Role</label>
                    <Select
                        className="pf-v5-c__react-select form__select--role"
                        options={roles.length > 0
                            ? roles.map((role) => ({
                                value: role.id || '', // Ensure value is always a string
                                label: role.name || '', // Fallback label if name is undefined
                            }))
                            : []
                        }
                        value={selectedRoleId
                            ? { value: selectedRoleId, label: roles.find(r => r.id === selectedRoleId)?.name || '' }
                            : null
                        }
                        onChange={handleRoleSelect}
                        placeholder={selectedClientId ? t("Select a role") : t("Please select a client first")}
                        noOptionsMessage={() => {
                            if (!selectedClientId) {
                                return 'Please select a client to view Roles.';
                            }
                            return (policy && policy.length === 0) ? 'No Roles available for this client.' : 'No Roles available';
                        }}

                    />
                    <div title='please select a client first'>
                        <PlusIcon className='pf-v5-c__add-icon'
                            onClick={selectedClientId ? handleOpenModal : undefined}
                            style={{ cursor: selectedClientId ? 'pointer' : 'not-allowed' }}
                        />
                        <AddRoleModal
                            isOpen={isModalOpen}
                            onClose={handleCloseModal}
                            selectedClientId={selectedClientId} // This will only pass a string value here
                            onSubmit={handleSubmit}
                        />
                    </div>

                </div>
                <div className="pf-v5-c-flex">
                    <label>Select Role Policy</label>
                    <Select
                        className="pf-v5-c__react-select"
                        options={selectedClientId && policy.length > 0
                            ? policy
                                .filter(p => p.id && p.name)
                                .map(p => ({
                                    value: p.id!, // Non-null assertion as `id` is required and must be a string
                                    label: p.name || 'Unknown Policy' // Provide a fallback value for `label` in case `name` is undefined
                                }))
                            : []
                        }
                        value={selectedPolicyId
                            ? { value: selectedPolicyId, label: policy.find(p => p.id === selectedPolicyId)?.name || '' }
                            : null
                        }
                        onChange={handlePolicySelect}
                        placeholder={selectedClientId ? t("Select a policy") : t("Please select a client first")}
                        noOptionsMessage={() => {
                            if (!selectedClientId) {
                                return 'Please select a client to view policy.';
                            }
                            return (policy && policy.length === 0) ? 'No Policy available for this client.' : 'No Policy available';
                        }}
                    />

                </div>
                <div className='pf-v5-c-flex'>
                    <label>Select Resource</label>

                    <AsyncSelect
                        className="pf-v5-c__react-select"
                        cacheOptions
                        defaultOptions={resource?.map((resourceItem) => ({
                            value: resourceItem._id || '', // Fallback if _id is undefined
                            label: resourceItem.name || '', // Fallback if resource.name is undefined
                        })) || []}
                        loadOptions={loadResources}
                        onChange={handleResourceChange} // Handle the multi-select change event
                        placeholder={selectedClientId ? "Select a Resource" : "Please select a client first"}
                        noOptionsMessage={() => {
                            if (selectedClientId === null) {
                                return 'Please select a client to view resources.';
                            }
                            return (resource && resource.length === 0) ? 'No resources available for this client.' : 'No Resources available';
                        }}
                    />
                </div>

                <div className="pf-v5-c-multi-select-container">

                    <div className="pf-v5-c-scope">
                        <h3>Available Options</h3>
                        <ul>
                            {!selectedClientId ? (
                                <li>{t("Please select a client first")}</li>
                            ) : Array.isArray(availableOptions) && availableOptions.length > 0 ? (
                                availableOptions.map((option) => (
                                    <li key={option.id}>
                                        <button className='pf-v5-c-scope-list' onClick={() => handleSelect(option)}>{option.name}</button>
                                    </li>
                                ))
                            ) : (
                                <li>{t("No available options")}</li>
                            )}
                        </ul>
                    </div>
                    <div>
                        <ArrowRightIcon style={{ fontSize: '28px' }} />
                    </div>

                    <div className="pf-v5-c-scope">
                        <h3>Selected Options</h3>
                        <ul>
                            {/* If no client is selected, show a message */}
                            {!selectedClientId ? (
                                <li>{t("Please select a client first")}</li>
                            ) : Array.isArray(selectedOptions) && selectedOptions.length > 0 ? (
                                selectedOptions.map((option) => (
                                    <li key={option.id}>
                                        <button className='pf-v5-c-scope-list' onClick={() => handleRemove(option)}>{option.name}</button>
                                    </li>
                                ))
                            ) : (
                                <li>{t("No selected options")}</li>
                            )}
                        </ul>
                    </div>
                </div>
                <button onClick={handleSaveRoles} className='pf-v5-c-form__button'>{t("Save")}</button>
            </div>

        </section>
    );
};

export default NewPermissionForm;
