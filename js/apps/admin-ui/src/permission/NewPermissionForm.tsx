import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { useAdminClient } from "../admin-client";
import { useAlerts } from "@keycloak/keycloak-ui-shared";
import type RoleRepresentation from "@keycloak/keycloak-admin-client/lib/defs/roleRepresentation";
import type ClientRepresentation from "@keycloak/keycloak-admin-client/lib/defs/clientRepresentation";
import AddRolePolicyModal from "./modals/AddRolePolicyModal";
import { fetchRolesForClient, createRole, fetchPoliciesForClient, fetchResourcesForClient, fetchScopesForClientResource, createScopePermission, createRolePolicy } from "./api/RoleApi";
import type PolicyRepresentation from "@keycloak/keycloak-admin-client/lib/defs/policyRepresentation";
import type ResourceRepresentation from "@keycloak/keycloak-admin-client/lib/defs/resourceRepresentation";
import type ScopeRepresentation from "@keycloak/keycloak-admin-client/lib/defs/scopeRepresentation";
import { PlusIcon } from '@patternfly/react-icons';
import { ArrowRightIcon, ArrowDownIcon } from '@patternfly/react-icons';
import { Divider, PageSection } from '@patternfly/react-core';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import "./permission.css";
import { Title } from '@patternfly/react-core';

const NewPermissionForm: React.FC = () => {
    const { adminClient } = useAdminClient();
    const { t } = useTranslation();
    const { addAlert, addError } = useAlerts();
    const [clients, setClients] = useState<ClientRepresentation[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [roles, setRoles] = useState<RoleRepresentation[]>([]);
    const [policy, setPolicy] = useState<PolicyRepresentation[]>([]);
    const [resource, setResource] = useState<ResourceRepresentation[]>([]);
    const [selectedResources, setSelectedResources] = useState<any[]>([]);
    const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [availableOptions, setAvailableOptions] = useState<ScopeRepresentation[]>([]);
    const [selectedOptions, setSelectedOptions] = useState<ScopeRepresentation[]>([]);
    const [isSmallScreen, setIsSmallScreen] = useState<boolean>(window.innerWidth <= 800);
    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth <= 850);
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const fetchAllClients = async () => {
        try {
            const fetchedClients = await adminClient.clients.find();
            setClients(fetchedClients);
        } catch (error) {
            console.error("Error fetching clients:", error);
            addError("client could not Fetch", error);
        }
    };

    useEffect(() => {
        fetchAllClients();
    }, []);

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

    const handleClientSelect = async (selectedOption: { value: string; label: string } | null) => {
        const selectedClientId = selectedOption ? selectedOption.value : "";
        setSelectedClientId(selectedClientId);
        setSelectedResources([]);
        setSelectedOptions([]);
        setAvailableOptions([]);
        if (!selectedClientId) {
            addAlert("Please select a client first");
        }
        try {

            setRoles([]);
            setPolicy([]);
            setResource([]);
            setSelectedRoleId(null);
            setSelectedPolicyId(null);

            const roles = await fetchRolesForClient(adminClient, selectedClientId);
            setRoles(roles);


            const resource = await fetchResourcesForClient(adminClient, selectedClientId);
            setResource(resource || []);
        } catch (error) {
            addError("Error Could not fetching All required data", error);
        }
    };

    const filteredRoles = roles
        .filter(role => role.id && role.name)
        .map(role => ({
            id: role.id!,
            name: role.name!,
        }));


    const handleSubmitRole = async (formData: { name: string; description: string }) => {
        if (!selectedClientId) {
            return;
        }
        try {

            const newRole = await createRole(adminClient, selectedClientId, formData);
          
            addAlert("Successfully Created Role");
        } catch (error) {
            addError("Error Roles has not been created", error);

        }
    };

    const handlePolicySubmit = async (formData: { name: string; description: string; roles: { id: string; required: boolean }[] }) => {
        console.log("Policy submitted with the following data:", formData);

        if (selectedClientId === null) {
            addError("Please select a client to add roles", "")
            return;
        }
        const rolesWithRequired = formData.roles.map((role) => ({
            id: role.id,  // Use `role.id` instead of `roleId`
            required: role.required,
        }));

        try {
            await createRolePolicy(adminClient, selectedClientId, {
                name: formData.name,
                description: formData.description,
                roles: rolesWithRequired,
            });
            addAlert("Successfully Created Policy");
            console.log(formData.roles[0])
            await updatePoliciesForRole(formData.roles[0].id);

        } catch (error) {
            console.error("Error creating role policy:", error);
            addError("Error Roles Policy has not bee created", error)
        }
    };

    const updatePoliciesForRole = async (roleId: string) => {
        try {
            const fetchedPolicies = await fetchPoliciesForClient(adminClient, selectedClientId!, 0, 11, false, "role");
            const filteredPolicies = fetchedPolicies?.filter((policyItem: PolicyRepresentation) => {
                if (policyItem.config && policyItem.config.roles) {
                    try {
                        const roleIds = JSON.parse(policyItem.config.roles).map((role: { id: string }) => role.id);
                        return roleIds.includes(roleId);
                    } catch (error) {
                        console.error("Error parsing roles in policy config:", error);
                        addError("Error parsing roles and could not policy updates", error)
                        return false;
                    }
                }
                return false;
            });

            setPolicy(filteredPolicies || []);
        } catch (error) {
            addError("Error fetching policies after policy creation", error);
        }
    };

    const handleRoleSelect = async (selectedOption: { value: string; label: string } | null) => {
        if (selectedOption) {
            setSelectedRoleId(selectedOption.value);

            try {
                const fetchedPolicies = await fetchPoliciesForClient(adminClient, selectedClientId!, 0, 11, false, "role");
                const filteredPolicies = fetchedPolicies?.filter((policyItem: PolicyRepresentation) => {
                    if (policyItem.config && policyItem.config.roles) {
                        try {
                            const roleIds = JSON.parse(policyItem.config.roles).map((role: { id: string }) => role.id);
                            return roleIds.includes(selectedOption.value);
                        } catch (error) {
                            console.error("Error parsing roles in policy config:", error);
                            return false;
                        }
                    }
                    return false;
                });


                setPolicy(filteredPolicies || []);
            } catch (error) {
                addError("Error fetching policies against role", error);
            }
        } else {
            setSelectedRoleId(null);
            setPolicy([]);
        }
    };


    const handlePolicySelect = (selected: { value: string; label: string | undefined } | null) => {
        if (selected) {
            setSelectedPolicyId(selected.value);
        } else {
            setSelectedPolicyId(null);
        }
    };

    const handleResourceChange = async (
        selected: { value: string, label: string } | null
    ) => {
        if (selected) {
            const selectedId = selected.value;
            setSelectedResources([selected]);
            if (selectedClientId) {
                try {

                    setSelectedOptions([]);
                    const scopes = await fetchScopesForClientResource(adminClient, selectedClientId, selectedId);
                    setAvailableOptions(scopes);

                } catch (error) {
                    console.error("Error fetching scopes for resource:", error);
                    addError("Resources could not fetching scopes", error);
                }
            }

        } else {
            setSelectedResources([]);
        }
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
                addError("Please select all the necessary fields *", "");
                return;
            }
            const selectedResourceIds = selectedResources.map((resourceItem) => resourceItem.value);
            if (selectedResourceIds.length === 0) {
                addError("Please select at least one resource.", "");
                return;
            }
            const selectedScopeIds = selectedOptions
                .map((option) => option.id)
                .filter((id): id is string => id !== undefined);

            const selectedClient = clients.find((client) => client.id === selectedClientId);

            if (!selectedClient) {
                addError("No client found for the selected client ID.", "");
                return;
            }

            const clientName = selectedClient.clientId;

            if (selectedScopeIds.length === 0) {
                alert("Please select at least one scope.");
                return;
            }

            for (let i = 0; i < selectedScopeIds.length; i++) {
                const scopeId = selectedScopeIds[i];

                const scopeName = selectedOptions
                    .filter((option) => option.id === scopeId)
                    .map((option) => option.name)[0];

                const name = `${clientName}.${scopeName}.perm`;

                const result = await createScopePermission(
                    adminClient,
                    selectedClientId,
                    selectedPolicyId,
                    selectedResourceIds,
                    [scopeId],
                    name
                );

                if (result?.response === 201) {
                    addAlert(`Successfully created permission`);
                }
                else {
                    addError(`Failed to create permission for scope ${scopeId}`, "");
                }
            }
        } catch (error) {
            addError("Failed to create scope permission", "");
        }
    };

    return (
        <PageSection variant="light" className="pf-v5-u-p-0">
            <section className='pf-v5-c-page__main-breadcrumb pf-v5-c-main-section pf-v5--font-family'>
                <Title headingLevel="h1" className="pf-v5-u-mt-sm pf-v5--font-family">Create Permission</Title>

                <Divider />
                <div className="pf-v5-c-flex">
                    <label>Select Client</label>
                    <Select
                        className="pf-v5-c__react-select"
                        options={clients.length > 0
                            ? clients.map((client) => ({
                                value: client.id || '',
                                label: client.clientId || '',
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
                        theme={(theme) => ({
                            ...theme,
                            colors: {
                                ...theme.colors,
                                primary: "rgb(247, 124, 26)",

                            },
                        })}
                    />
                </div>
                <div className='pf-v5-c-flex'>
                    <label>Select Role</label>
                    <div className='pf-v5-c-role-select'>
                        <Select
                            className="pf-v5-c__react-select form__select--role"
                            options={roles.length > 0
                                ? roles.map((role) => ({
                                    value: role.id || '',
                                    label: role.name || '',
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
                            theme={(theme) => ({
                                ...theme,
                                colors: {
                                    ...theme.colors,
                                    primary: "rgb(247, 124, 26)",

                                },
                            })}

                        />
                        <div title='please select a client first' className='add-icon-container'>
                            <PlusIcon className='pf-v5-c__add-icon'
                                onClick={selectedClientId ? handleOpenModal : undefined}
                                style={{ cursor: selectedClientId ? 'pointer' : 'not-allowed' }}
                            />

                            <AddRolePolicyModal
                                isOpen={isModalOpen}
                                onClose={handleCloseModal}
                                onSubmitRole={handleSubmitRole}
                                onSubmitPolicy={handlePolicySubmit}
                                roles={filteredRoles}

                            />
                        </div>
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
                                    value: p.id!,
                                    label: p.name || 'Unknown Policy'
                                }))
                            : []
                        }
                        value={selectedPolicyId
                            ? { value: selectedPolicyId, label: policy.find(p => p.id === selectedPolicyId)?.name || '' }
                            : null
                        }
                        onChange={handlePolicySelect}
                        placeholder={selectedClientId ? t("Select a policy") : t("Please select a Role")}
                        noOptionsMessage={() => {
                            if (!selectedRoleId) {
                                return 'Please select a role to view policies.';
                            }
                            return (policy && policy.length === 0) ? 'No Policy available for this Role.' : 'No Policy available';
                        }}
                        theme={(theme) => ({
                            ...theme,
                            colors: {
                                ...theme.colors,
                                primary: "rgb(247, 124, 26)",


                            },
                        })}
                    />

                </div>
                <div className='pf-v5-c-flex'>
                    <label>Select Resource</label>

                    <AsyncSelect
                        className="pf-v5-c__react-select"
                        defaultOptions={resource?.map((resourceItem) => ({
                            value: resourceItem._id || '',
                            label: resourceItem.name || '',
                        })) || []}
                        loadOptions={loadResources}
                        onChange={handleResourceChange}
                        value={selectedResources[0] || null}
                        placeholder={selectedClientId ? "Select a Resource" : "Please select a client first"}
                        noOptionsMessage={() => {
                            if (selectedClientId === null) {
                                return 'Please select a client to view resources.';
                            }
                            return (resource && resource.length === 0) ? 'No resources available for this client.' : 'No Resources available';
                        }}
                        theme={(theme) => ({
                            ...theme,
                            colors: {
                                ...theme.colors,
                                primary: "rgb(247, 124, 26)",

                            },
                        })}
                    />
                </div>

                <div className="pf-v5-c-multi-select-container">

                    <div className="pf-v5-c-scope">
                        <h3>Available Scopes</h3>
                        <ul>
                            {!selectedClientId ? (
                                <li style={{ color: "#8a8d90" }}>{t("Please select a client first")}</li>
                            ) : Array.isArray(availableOptions) && availableOptions.length > 0 ? (
                                availableOptions.map((option) => (
                                    <li key={option.id}>
                                        <button className='pf-v5-c-scope-list' onClick={() => handleSelect(option)}>{option.name}</button>
                                    </li>
                                ))
                            ) : (
                                <li style={{ color: "#8a8d90" }}>{t("No available options")}</li>
                            )}
                        </ul>
                    </div>
                    <div>

                        <div className='pf-v5-c-arrow-container '>
                            {isSmallScreen ? (
                                <ArrowDownIcon className='pf-v5-c-arrow-icon' />
                            ) : (
                                <ArrowRightIcon className='pf-v5-c-arrow-icon' />
                            )}
                        </div>

                    </div>

                    <div className="pf-v5-c-scope">
                        <h3>Selected Scopes</h3>
                        <ul>
                            {!selectedClientId ? (
                                <li style={{ color: "#8a8d90" }}>{t("Please select a client first")}</li>
                            ) : Array.isArray(selectedOptions) && selectedOptions.length > 0 ? (
                                selectedOptions.map((option) => (
                                    <li key={option.id} className="selected-scope-item">
                                        <button className='pf-v5-c-scope-list selected-scope' onClick={() => handleRemove(option)}>{option.name}

                                        </button>
                                    </li>
                                ))
                            ) : (
                                <li style={{ color: "#8a8d90" }}>{t("No selected options")}</li>
                            )}
                        </ul>
                    </div>
                </div>
                <button onClick={handleSaveRoles} className='pf-v5-c-form__button custom-bg-color'>{t("Save")}</button>

            </section>
        </PageSection>
    );
};

export default NewPermissionForm;



