#ifndef TILE_H
#define TILE_H

#include <node.h>
#include <node_object_wrap.h>
#include <nan.h>

#include <string>
#include <mapnik/map.hpp>
#include <mapnik/datasource_cache.hpp>
#include <mapnik/load_map.hpp>
#include <mapnik/save_map.hpp>
#include <mapnik/box2d.hpp>
#include <mapnik/agg_renderer.hpp>
#include <mapnik/image_util.hpp>

typedef std::shared_ptr<mapnik::Map> map_ptr;
#ifndef M_PI
#define M_PI 3.141592653589793238462643
#endif


class Tile : public Nan::ObjectWrap {
  public:
    static Nan::Persistent<v8::FunctionTemplate> constructor;
    static void Initialize(v8::Handle<v8::Object> target);
    Tile(int width, int height);
    static void New(const Nan::FunctionCallbackInfo<v8::Value>& info);

  private:
    ~Tile();
    static void Status(const Nan::FunctionCallbackInfo<v8::Value>& info);
    static void LoadMap(const Nan::FunctionCallbackInfo<v8::Value>& info);
    static void DataSourcePath(const Nan::FunctionCallbackInfo<v8::Value>& info);
    static void FontPath(const Nan::FunctionCallbackInfo<v8::Value>& info);
    static void GetTile(const Nan::FunctionCallbackInfo<v8::Value>& info);
    mapnik::box2d<double> xyz(int x, int y, int z);
    void from_pixels(double shift, double & x, double & y);
    map_ptr map;
    bool inUse;
};

#endif
