import { KeycloakSelect } from "@keycloak/keycloak-ui-shared";
import {
  Grid,
  GridItem,
  SelectOption,
  TextInput,
} from "@patternfly/react-core";
import { useState, memo } from "react";
import { UseControllerProps, useController, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import useToggle from "../../utils/useToggle";
import { DefaultValue } from "./KeyValueInput";

type KeySelectProp = UseControllerProps & {
  selectItems: DefaultValue[];
  onChange: (value: string) => void;
};

const KeySelect = ({ selectItems, onChange, ...rest }: KeySelectProp) => {
  const { t } = useTranslation();
  const [open, toggle] = useToggle();
  const { field } = useController(rest);
  const { resetField } = useFormContext();
  const [custom, setCustom] = useState(
    !selectItems.map(({ key }) => key).includes(field.value),
  );

  const handleSelectChange = (value: string | number | object) => {
    const selectedValue = String(value);
    resetField(field.name.replace('key', "value"))
    if (selectedValue) {
      setCustom(false);
    }
    field.onChange(selectedValue);
    onChange(selectedValue);
    toggle();
  };

  return (
    <Grid>
      <GridItem lg={custom ? 2 : 12}>
        <KeycloakSelect
          onToggle={() => toggle()}
          isOpen={open}
          onSelect={(value) => handleSelectChange(value)}
          selections={!custom ? [field.value] : ""}
        >
          {[
            <SelectOption key="custom" onClick={() => setCustom(true)}>
              {t("customAttribute")}
            </SelectOption>,
            ...selectItems.map((item) => (
              <SelectOption key={item.key} value={item.key}>
                {item.label}
              </SelectOption>
            )),
          ]}
        </KeycloakSelect>
      </GridItem>
      {custom && (
        <GridItem lg={10}>
          <TextInput
            id="customValue"
            data-testid={rest.name}
            placeholder={t("keyPlaceholder")}
            value={field.value}
            onChange={field.onChange}
            autoFocus
          />
        </GridItem>
      )}
    </Grid>
  );
};


export default memo(KeySelect)