import type RoleRepresentation from "@keycloak/keycloak-admin-client/lib/defs/roleRepresentation";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { FormAccess } from "../form/FormAccess";
import type { KeyValueType } from "./key-value-convert";
import  KeyValueInput  from "./KeyValueInput";
import { FixedButtonsGroup } from "../form/FixedButtonGroup";

export type AttributeForm = Omit<RoleRepresentation, "attributes"> & {
  attributes?: KeyValueType[];
};

export type AttributesFormProps = {
  form: UseFormReturn<AttributeForm>;
  save?: (model: AttributeForm) => void;
  reset?: () => void;
  fineGrainedAccess?: boolean;
  name?: string;
  isDisabled?: boolean;
};

export const AttributesForm = ({
  form,
  reset,
  save,
  fineGrainedAccess,
  name = "attributes",
  isDisabled = false,
}: AttributesFormProps) => {
  const noSaveCancelButtons = !save && !reset;
  const { handleSubmit } = form;
 
  const keyDropdownOptions = [
    {
      key: "timezone", label: "Timezone", 
      values: [
        "Asia/Aden",
        "Asia/Almaty",
        "Asia/Amman",
        "Asia/Ashgabat",
        "Asia/Baghdad",
        "Asia/Bahrain",
        "Asia/Baku",
        "Asia/Bangkok",
        "Asia/Beirut",
        "Asia/Bishkek",
        "Asia/Brunei",
        "Asia/Chita",
        "Asia/Colombo",
        "Asia/Damascus",
        "Asia/Dhaka",
        "Asia/Dili",
        "Asia/Dubai",
        "Asia/Dushanbe",
        "Asia/Hebron",
        "Asia/Ho_Chi_Minh",
        "Asia/Hong_Kong",
        "Asia/Hovd",
        "Asia/Irkutsk",
        "Asia/Jakarta",
        "Asia/Jayapura",
        "Asia/Jerusalem",
        "Asia/Kabul",
        "Asia/Kamchatka",
        "Asia/Karachi",
        "Asia/Kathmandu",
        "Asia/Kolkata",
        "Asia/Kuala_Lumpur",
        "Asia/Kuwait",
        "Asia/Macau",
        "Asia/Makassar",
        "Asia/Manila",
        "Asia/Muscat",
        "Asia/Nicosia",
        "Asia/Novosibirsk",
        "Asia/Omsk",
        "Asia/Phnom_Penh",
        "Asia/Pyongyang",
        "Asia/Qatar",
        "Asia/Riyadh",
        "Asia/Sakhalin",
        "Asia/Seoul",
        "Asia/Shanghai",
        "Asia/Singapore",
        "Asia/Taipei",
        "Asia/Tashkent",
        "Asia/Tbilisi",
        "Asia/Tehran",
        "Asia/Thimphu",
        "Asia/Tokyo",
        "Asia/Ulaanbaatar",
        "Asia/Urumqi",
        "Asia/Vientiane",
        "Asia/Vladivostok",
        "Asia/Yangon",
        "Asia/Yekaterinburg",
        "Asia/Yerevan",
      ]

    },
    { key: "core", label: "Core", },
    { key: "payout", label: "Payout", },
    { key: "estate", label: "Estate", },
  ]
  
  return (
    <FormAccess
      role="manage-realm"
      onSubmit={save ? handleSubmit(save) : undefined}
      fineGrainedAccess={fineGrainedAccess}
    >
      <FormProvider {...form}>
        <KeyValueInput name={name} isDisabled={isDisabled} defaultKeyValue={keyDropdownOptions}/>
      </FormProvider>
      {!noSaveCancelButtons && (
        <FixedButtonsGroup name="attributes" reset={reset} isSubmit />
      )}
    </FormAccess>
  );
};
