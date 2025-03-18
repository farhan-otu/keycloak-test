import { KeycloakSelect } from "@keycloak/keycloak-ui-shared";
import { SelectOption, TextInput } from "@patternfly/react-core";
import { UseControllerProps, useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { DefaultValue } from "./KeyValueInput";
import { memo, useMemo, useState } from "react";


type ValueSelectProps = UseControllerProps & {
  selectItems: DefaultValue[];
  keyValue: string;
};

const ValueSelect = ({
  selectItems,
  keyValue,
  ...rest
}: ValueSelectProps) => {
  const { t } = useTranslation();
  const { field } = useController(rest);
  const [open, setOpen] = useState(false);
  const defaultItem = useMemo(
    () => selectItems.find((v) => v.key === keyValue),
    [selectItems, keyValue],
  );

  const isNoRolesAvailable = defaultItem && defaultItem?.values && defaultItem?.values?.length === 0;

  return defaultItem?.values ? (
    <KeycloakSelect
      onToggle={(isOpen) => setOpen(isOpen)}
      isOpen={open}
      onSelect={(value) => {
      field.onChange(value); 
      setOpen(false); 
      }}
      selections={field.value ? [field.value] : t("choose")}
      placeholderText={t("valuePlaceholder")}

    >
      {isNoRolesAvailable ? (
        <SelectOption isDisabled value="no-roles">
          {t(`There are no roles for ${keyValue} client`)} 
        </SelectOption>
      ) : (
        defaultItem.values.map((item) => (
          <SelectOption key={item} value={item}>
            {item}
          </SelectOption>
        ))
      )}
    </KeycloakSelect>
  )
    : (
      <TextInput
        aria-label={t("customValue")}
        data-testid={rest.name}
        {...field}

      />
    );
};
export default memo(ValueSelect)