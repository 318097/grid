import _ from "lodash";
import React, { Fragment } from "react";
import { Input, Select, Button, Radio, Collapse, Upload, Tag } from "antd";
import { GENERIC_CLASSES, PROPERTIES_MAP } from "../config";
import { getCleanKey, splitName } from "../helpers";
import { useDispatch, useSelector } from "react-redux";
import {
  applyNextThemeOrVariant,
  resetElement,
  saveThemeOrVariant,
  setDataThunk,
  setPropertyType,
  setSelectedFiles,
  updateDataConfig,
} from "../store";
import { EyeFilled, EyeInvisibleFilled, PlusOutlined } from "@ant-design/icons";

const { TextArea } = Input;

const getBase64 = (img, callback) => {
  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result));
  reader.readAsDataURL(img);
};

const Sidebar = ({ selectedElement, handlePropertyChange, isGlobal }) => {
  const dispatch = useDispatch();
  const {
    data,
    localProperties,
    globalProperties,
    propertyType,
    themes,
    dataConfig = {},
  } = useSelector((state) => state.sdata);

  const { element } = splitName(selectedElement);

  const handleMediaChange = (file, fileList) => {
    const filesPromises = fileList.map(
      (file) =>
        new Promise((resolve) => {
          getBase64(file, (url) => {
            resolve({
              name: file.name,
              uid: file.uid,
              size: file.size,
              url,
              status: "done",
              thumbUrl: url,
            });
          });
        })
    );

    Promise.all(filesPromises).then((files) => {
      dispatch(setSelectedFiles(files));
    });

    return false;
  };

  const getProperties = (list) => {
    const props = {
      selectedElement,
      isGlobal,
      globalProperties,
      localProperties,
      handlePropertyChange,
      properties: list.map((key) => PROPERTIES_MAP[key]),
    };
    return <Properties {...props} />;
  };

  const items = [
    {
      key: "5",
      label: "General",
      children: getProperties(["bg-color"]),
      visible: true,
    },
    {
      key: "1",
      label: "Font",
      children: getProperties(["font-family", "text-size", "text-color"]),
      visible: !GENERIC_CLASSES.includes(element),
    },
    {
      key: "2",
      label: "Decoration & Styling",
      children: getProperties([
        "text-weight",
        "font-style",
        "text-align",
        "text-transform",
        "text-decoration",
        "text-decoration-color",
      ]),
      visible: !GENERIC_CLASSES.includes(element),
    },
    {
      key: "4",
      label: "Border",
      children: getProperties(["border", "border-radius", "border-color"]),
      visible: !GENERIC_CLASSES.includes(element),
    },
    {
      key: "3",
      label: "Spacing",
      children: getProperties(["flex-basis", "flex-width", "padding"]),
      visible: !GENERIC_CLASSES.includes(element),
    },
  ];
  const selectedElementVariants = _.get(
    dataConfig,
    [element, "variants"],
    []
  ).length;
  return (
    <div className="flex flex-col gap-2 bg-gray-50 border border-l-gray-200 p-2 w-[300px] shrink-0 h-full overflow-auto">
      {Object.keys(data)
        .sort((a, b) => {
          const orderA = _.get(dataConfig, [a, "order"], Infinity);
          const orderB = _.get(dataConfig, [b, "order"], Infinity);
          return orderA - orderB;
        })
        .map((key) => {
          const config = _.get(dataConfig, key, {});
          const rows = _.get(config, "rows", 3);
          const visible = _.get(config, "visible", true);

          return (
            <div className="flex flex-col items-start gap-1 mb-3" key={key}>
              <label
                className={`text-xs font-bold ${
                  visible ? "" : "text-gray-400"
                }`}
              >
                {key}&nbsp;
                <span
                  className="cursor-pointer"
                  onClick={() =>
                    dispatch(updateDataConfig({ key, property: "visible" }))
                  }
                >
                  {visible ? <EyeFilled /> : <EyeInvisibleFilled />}
                </span>
              </label>
              {key === "files" ? (
                <Upload
                  className="w-full"
                  listType="picture"
                  multiple
                  // showUploadList={false}
                  accept=".png,.jpg,.jpeg,.gif"
                  beforeUpload={handleMediaChange}
                  fileList={data.files}
                  onRemove={(file) => {
                    const newFiles = data.files.filter(
                      (f) => f.uid !== file.uid
                    );
                    dispatch(setSelectedFiles(newFiles));
                  }}
                >
                  <Button>
                    <PlusOutlined />
                    Upload
                  </Button>
                </Upload>
              ) : (
                <TextArea
                  rows={rows}
                  placeholder={key}
                  value={data[key]}
                  onChange={(e) =>
                    dispatch(setDataThunk({ [key]: e.target.value }))
                  }
                  spellCheck={false}
                />
              )}
            </div>
          );
        })}

      {!!selectedElement && (
        <Fragment>
          <hr />
          <div className="flex flex-col items-start gap-1 mb-3">
            <label className="text-xs font-bold">
              selected element
              {selectedElementVariants > 0 ? (
                <Tag
                  className="ml-2 cursor-pointer text-xs font-normal"
                  onClick={() =>
                    dispatch(applyNextThemeOrVariant(selectedElement))
                  }
                >{`${selectedElementVariants} variant(s)`}</Tag>
              ) : null}
            </label>
            <h3 className="text-base font-bold text-left truncate max-w-full overflow-hidden">
              {selectedElement}
            </h3>
            <div className="flex gap-2 w-full">
              <Button
                className="grow"
                onClick={() => dispatch(resetElement(selectedElement))}
              >
                Reset
              </Button>
              <Button
                className="grow"
                onClick={() => dispatch(saveThemeOrVariant(selectedElement))}
              >
                Save variant
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-start gap-1 mb-3">
            <label className="text-xs font-bold">properties</label>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={[
                {
                  label: "Global",
                  value: "global",
                },
                {
                  label: "Local",
                  value: "local",
                },
              ]}
              onChange={(e) => dispatch(setPropertyType(e.target.value))}
              value={propertyType}
            />
            <div className="w-full mt-2">
              <Collapse
                items={items.filter((item) => item.visible)}
                defaultActiveKey={["1", "2", "5"]}
                size="small"
                bordered={false}
              />
            </div>
          </div>
        </Fragment>
      )}
      <hr />
      <div className="flex flex-col items-start gap-1 mt-2">
        <label className="text-xs font-bold">Theme ({themes.length})</label>
        <div className="flex gap-2 w-full">
          <Button
            disabled={!themes.length}
            type="primary"
            className="grow"
            onClick={() => dispatch(applyNextThemeOrVariant())}
          >
            Random
          </Button>
          <Button
            className="grow"
            onClick={() => dispatch(saveThemeOrVariant())}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

const Properties = ({
  selectedElement,
  isGlobal,
  globalProperties,
  localProperties,
  handlePropertyChange,
  properties,
}) => {
  return (
    <Fragment>
      {properties.map((property) => {
        const { options, label, key } = property;
        const { element } = splitName(selectedElement);

        const globalValue = _.get(globalProperties, [
          getCleanKey(element),
          key,
        ]);

        const value = isGlobal
          ? globalValue
          : _.get(localProperties, [selectedElement, key]);

        return (
          <div
            className="flex flex-col items-start gap-1 mb-3"
            key={`${isGlobal ? "g-" : "l-"}${key}`}
          >
            <label className="text-xs font-bold">{label}</label>
            <Select
              options={options}
              onChange={(value) => handlePropertyChange(key, value)}
              value={value}
              className="w-full"
              placeholder={globalValue}
            />
          </div>
        );
      })}
    </Fragment>
  );
};
export default Sidebar;
