from copy import deepcopy
from typing import List

from utils.dict_utils import get_dict_paths_with_key, get_dict_at_path


def resolve_refs(schema, defs):
    if isinstance(schema, dict):
        if "$ref" in schema:
            ref_path = schema["$ref"]
            if ref_path.startswith("#/$defs/"):
                def_key = ref_path.replace("#/$defs/", "")
                return resolve_refs(defs[def_key], defs)
            else:
                raise ValueError(f"Unsupported $ref path: {ref_path}")
        else:
            return {k: resolve_refs(v, defs) for k, v in schema.items()}
    elif isinstance(schema, list):
        return [resolve_refs(item, defs) for item in schema]
    else:
        return schema


def flatten_schema(schema):
    schema = deepcopy(schema)
    defs = schema.pop("$defs", {})
    return resolve_refs(schema, defs)


def remove_fields_from_schema(schema: dict, fields_to_remove: List[str]):
    schema = deepcopy(schema)
    properties_paths = get_dict_paths_with_key(schema, "properties")
    for path in properties_paths:
        parent_obj = get_dict_at_path(schema, path)
        if "properties" in parent_obj and isinstance(parent_obj["properties"], dict):
            for field in fields_to_remove:
                if field in parent_obj["properties"]:
                    del parent_obj["properties"][field]

    required_paths = get_dict_paths_with_key(schema, "required")
    for path in required_paths:
        parent_obj = get_dict_at_path(schema, path)
        if "required" in parent_obj and isinstance(parent_obj["required"], list):
            parent_obj["required"] = [
                field
                for field in parent_obj["required"]
                if field not in fields_to_remove
            ]

    return schema


# ? Not used
def generate_constraint_sentences(schema: dict) -> str:
    """
    Generate human-readable constraint sentences from a JSON schema.

    Args:
        schema: JSON schema dictionary

    Returns:
        String containing constraint sentences separated by newlines
    """
    constraints = []

    def extract_constraints_recursive(obj, prefix=""):
        if isinstance(obj, dict):
            if "properties" in obj:
                properties = obj["properties"]
                for prop_name, prop_def in properties.items():
                    current_path = f"{prefix}.{prop_name}" if prefix else prop_name

                    if isinstance(prop_def, dict):
                        prop_type = prop_def.get("type")

                        # Handle string constraints
                        if prop_type == "string":
                            min_length = prop_def.get("minLength")
                            max_length = prop_def.get("maxLength")

                            if min_length is not None and max_length is not None:
                                constraints.append(
                                    f"    - {current_path} should be less than {max_length} characters and greater than {min_length} characters"
                                )
                            elif max_length is not None:
                                constraints.append(
                                    f"    - {current_path} should be less than {max_length} characters"
                                )
                            elif min_length is not None:
                                constraints.append(
                                    f"    - {current_path} should be greater than {min_length} characters"
                                )

                        # Handle array constraints
                        elif prop_type == "array":
                            min_items = prop_def.get("minItems")
                            max_items = prop_def.get("maxItems")

                            if min_items is not None and max_items is not None:
                                constraints.append(
                                    f"    - {current_path} should have more than {min_items} items and less than {max_items} items"
                                )
                            elif max_items is not None:
                                constraints.append(
                                    f"    - {current_path} should have less than {max_items} items"
                                )
                            elif min_items is not None:
                                constraints.append(
                                    f"    - {current_path} should have more than {min_items} items"
                                )

                        # Recurse into nested objects
                        if prop_type == "object" or "properties" in prop_def:
                            extract_constraints_recursive(prop_def, current_path)

                        # Handle array items if they have properties
                        if prop_type == "array" and "items" in prop_def:
                            items_def = prop_def["items"]
                            if isinstance(items_def, dict) and (
                                "properties" in items_def
                                or items_def.get("type") == "object"
                            ):
                                extract_constraints_recursive(
                                    items_def, f"{current_path}[*]"
                                )

            # Also recurse into other nested structures
            for key, value in obj.items():
                if key not in [
                    "properties",
                    "type",
                    "minLength",
                    "maxLength",
                    "minItems",
                    "maxItems",
                ] and isinstance(value, dict):
                    extract_constraints_recursive(value, prefix)

    # Start extraction from the root schema
    extract_constraints_recursive(schema)

    return "\n".join(constraints)
