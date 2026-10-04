/// <reference types="@webgpu/types" />

// Loads the WebGPU global types (GPU, GPUAdapter, GPUTexture, ...) without
// setting `compilerOptions.types`.
//
// Setting `types` would switch TypeScript from "include every @types package"
// to "include only these", which would drop @types/node and break Node globals
// elsewhere in the project. A triple-slash reference adds the one package we
// actually want and leaves the rest of the auto-inclusion alone.
//
// The orbs in components/orbs/ need these: they hand `navigator.gpu` straight to
// typeGPU's WebGPU backend, so there is no library boundary to infer types from.
