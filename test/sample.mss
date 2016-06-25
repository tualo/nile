/* Define a few colors */
@black: #000;
@orange: #f90;
@white: #fff;
@lightgray: #ddd;
@roadwidth: 3.5;

/* Start with a white background */
Map {
  background-color: #fff;
}

/* Draw roads as orange lines */
#roads::outline
{
  line-color: #bbb;
  line-width: 3.5;
  [highway=primary],[highway=primary_link] { line-width: 9; }
  [highway=motorway],[highway=motorway_link] { line-width: 13; }
  [highway=residential],[highway=residential_link] { line-width: 7; }
  [highway=tertiary],[highway=tertiary_link] { line-width: 6; }
  [highway=secondary],[highway=secondary_link] { line-width: 7;}
}

#roads
{
    /* Usually, 3px wide */
    line-width: 3;
    line-color: @orange;

    /* Make the important ones wider */

    [highway=motorway],[highway=motorway_link] {
      line-width: mult(add(@roadwidth,1.6),4);
      line-color: #0000ff;
    }

    [highway=primary],[highway=primary_link] {
      line-width: mult(add(@roadwidth,1.3),4);
      line-color: #0eff00;
    }

    [highway=secondary],[highway=secondary_link] {
      line-width: mult(add(@roadwidth,1),4);
      line-color: #c00;
    }

    [highway=tertiary],[highway=tertiary_link] {
      line-width: mult(add(@roadwidth,1),3);
      line-color: #aaaaff;
    }

    [highway=residential],[highway=residential_link] {
      line-width: mult(add(@roadwidth,0.5),2);
      line-color: #deffde;
    }

    [highway=living_street]{
      line-width: mult(add(@roadwidth,0),1);
      line-color: @lightgray;
    }

    [highway=service]{
      line-width: mult(add(@roadwidth,-0.5),1);
      line-color: #ccc;
    }

    [bridge=yes]{
      opacity: 0.5;
    }
    [tunnel=yes]{
      line-width: 15;
      opacity: 0.5;
    }

    /* Add the road names in black */
    name
    {
        text-placement: line;
        text-face-name: "DejaVu Sans Book";
        text-fill: @black;
        text-size: 12;
    }
}

#roads
{
  [zoom>12]{
    additional-property: 1;
  }
}
