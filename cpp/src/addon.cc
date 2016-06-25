#include <node.h>
#include "tile.h"

using namespace v8;

void InitTILE(Handle<Object> target) {
  Tile::Initialize(target);
}

NODE_MODULE(ocr_bindings, InitTILE)
