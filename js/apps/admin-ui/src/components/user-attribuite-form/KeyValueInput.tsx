import {
  ActionList,
  ActionListItem,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  TextInput,
} from "@patternfly/react-core";
import { MinusCircleIcon, PlusCircleIcon } from "@patternfly/react-icons";
import type RoleRepresentation from "@keycloak/keycloak-admin-client/lib/defs/roleRepresentation";
import { fetchRolesForClient } from "../../permission/api/RoleApi";
import { Fragment, useState, useEffect, useCallback, memo } from "react";
import { useAdminClient } from "../../admin-client";
import {
  FieldValues,
  useFieldArray,
  useFormContext,
  useWatch,
  Controller
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import type ClientRepresentation from "@keycloak/keycloak-admin-client/lib/defs/clientRepresentation";
import KeySelect from "./KeySelect";
import ValueSelect from "./ValueSelect";



export type DefaultValue = {
  key: string;
  values?: string[];
  label: string;
};

type KeyValueInputProps = {
  name: string;
  label?: string;
  defaultKeyValue?: DefaultValue[];
  isDisabled?: boolean;

};

const KeyValueInput = ({
  name,
  label = "attributes",
  defaultKeyValue,
  isDisabled = false,

}: KeyValueInputProps) => {

  const { adminClient } = useAdminClient();
  const [selectedKey, setSelectedKey] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [roles, setRoles] = useState<RoleRepresentation[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientRepresentation[]>([]);
  const [keyValueOptionsState, setKeyValueOptionsState] = useState<DefaultValue[]>(defaultKeyValue ?? []);
  const [valueKeyState, setValueKeyState] = useState<string >("");

  useEffect(() => {
    const fetchClients = async () => {
      try {

        const fetchedClients = await adminClient.clients.find();
        const clientIdsToFind = ['core', 'payout', 'estate'];
        // these three clients filter with admin clients 
        const filteredClients = fetchedClients.filter(client =>
          clientIdsToFind.some(id => client.clientId?.toLowerCase() === id.toLowerCase())
        );
        setFilteredClients(filteredClients);
        setKeyValueOptionsState(prev => {
          return prev
            .map(item => {

              if (clientIdsToFind.includes(item.key)) {

                const clientExists = filteredClients.find(client =>
                  client.clientId?.toLowerCase() === item.key.toLowerCase()
                );

                if (!clientExists) {
                  return undefined;
                }
              }

              return item;
            })
            .filter(item => item !== undefined);
        });

      } catch (error) {
        console.error("Error for fetching admin clients:", error);
      }
    };

    fetchClients();

  }, []);
  
  const { t } = useTranslation();
  const {
    control,
    register,
    formState: { errors },
    resetField
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    shouldUnregister: true,
    control,
    name,
  });

  const appendNew = () => append({ key: "", value: "" });

  const values = useWatch<FieldValues>({
    name,
    control,
    defaultValue: [],
  });

  const handleKeyChange = useCallback(async (key: string) => {

    setSelectedKey(key);
    // onKeyChange(key);
    setValueKeyState(""); 
    

    if (["core", "payout", "estate"].includes(key)) {
      try {
        const selectedClient = filteredClients.find(client => client.clientId?.toLowerCase() === key?.toLowerCase());

        if (selectedClient?.id) {

          const roles = await fetchRolesForClient(adminClient, selectedClient.id); 
          setRoles(roles)
          const filteredRoles = roles.map((role: RoleRepresentation) => role.name)

          setKeyValueOptionsState((prev) => {
            const updatedKeyValue = prev.map(item => {
              if (item.key === key) {
                return {
                  ...item,
                  values: filteredRoles, // Add the fetched roles to the respective key
                };
              }

              return item;
            });
            return updatedKeyValue;

          });
        }
      }
      catch (err) {
        console.error("Error occurred while fetching roles for client:", err);
        setRoles([]);
      }
    }
  }, [filteredClients]);

  return fields.length > 0 ? (
    <>
      <Grid hasGutter>
        <GridItem className="pf-v5-c-form__label" span={5}>
          <span className="pf-v5-c-form__label-text">{t("key")}</span>
        </GridItem>
        <GridItem className="pf-v5-c-form__label" span={7}>
          <span className="pf-v5-c-form__label-text">{t("value")}</span>
        </GridItem>
        {fields.map((attribute, index) => {
          const error = (errors as any)[name]?.[index];
          const keyError = !!error?.key;
          const valueErrorPresent = !!error?.value || !!error?.message;
          const valueError = error?.message || t("valueError");

          return (
            <Fragment key={attribute.id}>
              <GridItem span={5}>
                {defaultKeyValue ? (
                  <>
                    <KeySelect
                      name={`${name}.${index}.key`}
                      selectItems={keyValueOptionsState || []}
                      onChange={(value) => handleKeyChange(value)}
                      rules={{ required: true }}
                    />
                  </>
                ) : (
                  <TextInput
                    placeholder={t("keyPlaceholder")}
                    aria-label={t("key")}
                    data-testid={`${name}-key`}
                    {...register(`${name}.${index}.key`, { required: true })}
                    validated={keyError ? "error" : "default"}
                    isRequired
                    isDisabled={isDisabled}
                  />
                )}
                {keyError && (
                  <HelperText>
                    <HelperTextItem variant="error">
                      {t("keyError")}
                    </HelperTextItem>
                  </HelperText>
                )}
              </GridItem>
              <GridItem span={5}>
                {defaultKeyValue ? (
                  <>
                    <ValueSelect
                      name={`${name}.${index}.value`}
                      keyValue={values[index]?.key}
                      selectItems={keyValueOptionsState} 
                      rules={{ required: true }}
                    />
                  </>
                ) : (
                  <>
                    <TextInput
                      placeholder={t("valuePlaceholder")}
                      aria-label={t("value")}
                      data-testid={`${name}-value`}
                      {...register(`${name}.${index}.value`, { required: true })}
                      validated={valueErrorPresent ? "error" : "default"}
                      isRequired
                      isDisabled={isDisabled}
                    />
                  </>
                )}
                {valueErrorPresent && (
                  <HelperText>
                    <HelperTextItem variant="error">
                      {valueError}
                    </HelperTextItem>
                  </HelperText>
                )}
              </GridItem>
              <GridItem span={2}>
                <Button
                  variant="link"
                  title={t("removeAttribute")}
                  onClick={() => remove(index)}
                  data-testid={`${name}-remove`}
                  isDisabled={isDisabled}
                >
                  <MinusCircleIcon />
                </Button>
              </GridItem>
            </Fragment>
          );
        })}
      </Grid>
      <ActionList>
        <ActionListItem>
          <Button
            data-testid={`${name}-add-row`}
            className="pf-v5-u-px-0 pf-v5-u-mt-sm"
            variant="link"
            icon={<PlusCircleIcon />}
            onClick={appendNew}
            isDisabled={isDisabled}
          >
            {t("addAttribute", { label })}
          </Button>
        </ActionListItem>
      </ActionList>
    </>
  ) : (
    <EmptyState
      data-testid={`${name}-empty-state`}
      className="pf-v5-u-p-0"
      variant="xs"
    >
      <EmptyStateBody>{t("missingAttributes", { label })}</EmptyStateBody>
      <EmptyStateFooter>
        <Button
          data-testid={`${name}-add-row`}
          variant="link"
          icon={<PlusCircleIcon />}
          size="sm"
          onClick={appendNew}
          isDisabled={isDisabled}
        >
          {t("addAttribute", { label })}
        </Button>
      </EmptyStateFooter>
    </EmptyState>
  );
};

export default memo(KeyValueInput)
