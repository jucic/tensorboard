load("//tensorboard/defs:defs.bzl", "tf_ts_library")

package(default_visibility = ["//tensorboard:internal"])

tf_ts_library(
    name = "types",
    srcs = [
        "scale_types.ts",
        "types.ts",
    ],
)

tf_ts_library(
    name = "layout",
    srcs = [
        "composite_layout.ts",
        "flex_layout.ts",
        "layout.ts",
    ],
    deps = [":types"],
)

tf_ts_library(
    name = "worker_pool",
    srcs = ["worker_pool.ts"],
    deps = [
        ":worker",
    ],
)

tf_ts_library(
    name = "worker",
    srcs = ["worker.ts"],
    visibility = ["//visibility:private"],
)

tf_ts_library(
    name = "scale",
    srcs = [
        "scale.ts",
    ],
    deps = [
        ":types",
        "@npm//@types/d3",
        "@npm//d3",
    ],
)

tf_ts_library(
    name = "lib_tests",
    testonly = True,
    srcs = [
        "layout_test.ts",
        "scale_test.ts",
        "worker_pool_test.ts",
    ],
    deps = [
        ":layout",
        ":scale",
        ":types",
        ":worker",
        ":worker_pool",
        "@npm//@types/jasmine",
    ],
)
