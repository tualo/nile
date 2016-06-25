#include "tile.h"

using namespace v8;

Nan::Persistent<FunctionTemplate> Tile::constructor;

Tile::Tile(int width,int height) :
    Nan::ObjectWrap(),
    map(std::make_shared<mapnik::Map>(width,height)){
}

Tile::~Tile() {
  //delete map;
}

void Tile::from_pixels(double shift, double & x, double & y)
{
    double b = shift/2.0;
    x = (x - b)/(shift/360.0);
    double g = (y - b)/-(shift/(2 * M_PI));
    y = mapnik::R2D * (2.0 * std::atan(std::exp(g)) - mapnik::M_PI_by2);
}

mapnik::box2d<double> Tile::xyz(int x, int y, int z){
  double minx;
  double miny;
  double maxx;
  double maxy;
  minx = x * map.get()->width();
  miny = (y + 1.0) * map.get()->height();
  maxx = (x + 1.0) * map.get()->width();
  maxy = y * map.get()->height();
  double shift = std::pow(2.0,z) * map.get()->width();

  from_pixels(shift,minx,miny);
  from_pixels(shift,maxx,maxy);
  mapnik::lonlat2merc(&minx,&miny,1);
  mapnik::lonlat2merc(&maxx,&maxy,1);

  mapnik::box2d<double> extent(minx,miny,maxx,maxy);
  return extent;
}


void Tile::Initialize(v8::Handle<v8::Object> exports) {
  Isolate* isolate = Isolate::GetCurrent();
  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(Tile::New);
  constructor.Reset(tpl);

  tpl->SetClassName(String::NewFromUtf8(isolate, "Tile"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  Nan::SetPrototypeMethod(tpl, "status", Status);

  Nan::SetPrototypeMethod(tpl, "loadMap", LoadMap);
  Nan::SetPrototypeMethod(tpl, "dataSourcePath", DataSourcePath);
  Nan::SetPrototypeMethod(tpl, "fontPath", FontPath);
  Nan::SetPrototypeMethod(tpl, "getTile", GetTile);

  //Nan::SetPrototypeMethod(tpl, "getTile", GetTile);
  //Nan::SetPrototypeMethod(tpl, "end", End);
  exports->Set(String::NewFromUtf8(isolate, "Tile"), tpl->GetFunction());
}

void Tile::New(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  if (info.IsConstructCall()) {
    Tile* m = new Tile(info[0]->IntegerValue(),info[1]->IntegerValue());
    m->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
  } else {
    Nan::ThrowTypeError("Cannot instantiate without new");
  }
}

void Tile::Status(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  Tile* obj = Nan::ObjectWrap::Unwrap<Tile>(info.This());
  info.GetReturnValue().Set(obj->inUse);
}

void Tile::FontPath(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  if (info.Length() == 1){
    Tile* obj = Nan::ObjectWrap::Unwrap<Tile>(info.This());
    v8::String::Utf8Value arg_filename(info[0]->ToString());
    char *path;
    path = *arg_filename;
    mapnik::freetype_engine::register_fonts(path,true);
    /*
    std::vector<std::string> face_names;

    face_names = mapnik::freetype_engine::face_names();
    std::cout << "number of registered fonts: " << face_names.size() << std::endl;
    for (std::vector<std::string>::iterator it = face_names.begin() ; it != face_names.end(); ++it)
    std::cout << " " << *it << std::endl;
    */
    info.GetReturnValue().Set(true);
  }else{
    info.GetReturnValue().Set(false);
  }
}


void Tile::DataSourcePath(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  if (info.Length() == 1){
    Tile* obj = Nan::ObjectWrap::Unwrap<Tile>(info.This());
    v8::String::Utf8Value arg_filename(info[0]->ToString());
    char *path;
    path = *arg_filename;
    mapnik::datasource_cache::instance().register_datasources(path);
    info.GetReturnValue().Set(true);
  }else{
    info.GetReturnValue().Set(false);
  }
}

void Tile::LoadMap(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  if (info.Length() == 1){
    Tile* obj = Nan::ObjectWrap::Unwrap<Tile>(info.This());
    v8::String::Utf8Value arg_filename(info[0]->ToString());
    char *file;
    file = *arg_filename;
    mapnik::load_map(*obj->map.get(),file,true);
    info.GetReturnValue().Set(true);
  }else if (info.Length() == 2){
    Tile* obj = Nan::ObjectWrap::Unwrap<Tile>(info.This());
    v8::String::Utf8Value arg_xml(info[0]->ToString());
    char *xml;
    xml = *arg_xml;
    v8::String::Utf8Value arg_base(info[1]->ToString());
    char *base;
    base = *arg_base;
    mapnik::load_map_string(*obj->map.get(),xml,true,base);
    info.GetReturnValue().Set(true);
  }else{
    info.GetReturnValue().Set(false);
  }
}


void Tile::GetTile(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  Tile* obj = Nan::ObjectWrap::Unwrap<Tile>(info.This());
  //if (obj->inUse==false){
    obj->inUse=true;
    int zoom = info[0]->Uint32Value();
    int x = info[1]->Uint32Value();
    int y = info[2]->Uint32Value();
    v8::String::Utf8Value arg_filename(info[3]->ToString());
    std::string output = std::string(*arg_filename);
    double scale_factor = 1.0;


    mapnik::Map map = *obj->map.get();
    mapnik::box2d<double> box = obj->xyz(x,y,zoom );
    map.zoom_to_box( box );
    mapnik::image_rgba8 im(map.width(),map.height());
    mapnik::request req(map.width(), map.height(), map.get_current_extent());
    req.set_buffer_size(map.buffer_size());
    mapnik::agg_renderer<mapnik::image_rgba8> ren(map,req,mapnik::attributes(),im,scale_factor,0,0);
    ren.apply();
    mapnik::save_to_file(im,output);
    obj->inUse=false;
  //}else{
  //  std::cout << "in use " << std::endl;
  //}

  info.GetReturnValue().Set(true);
}
