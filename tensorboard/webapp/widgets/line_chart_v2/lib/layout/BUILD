load("//tensorboard/defs:defs.bzl", "tf_ts_library")

package(default_visibility = ["//tensorboard:internal"])

tf_ts_library(
    name = "layout",
    srcs = [
        "composite_layout.ts",
        "drawable.ts",
        "flex_layout.ts",
        "layout.ts",
        "root_layout.ts",
    ],
    deps = [
        "//tensorboard/webapp/widgets/line_chart_v2/lib:coordinator",
        "//tensorboard/webapp/widgets/line_chart_v2/lib:types",
        "//tensorboard/webapp/widgets/line_chart_v2/lib/renderer:types",
    ],
)

tf_ts_library(
    name = "layout_test",
    testonly = True,
    srcs = [
        "integration_test.ts",
        "layout_test.ts",
    ],
    deps = [
        ":layout",
        "//tensorboard/webapp/widgets/line_chart_v2/lib:coordinator",
        "//tensorboard/webapp/widgets/line_chart_v2/lib:types",
        "//tensorboard/webapp/widgets/line_chart_v2/lib/renderer",
        "@npm//@types/jasmine",
    ],
)
