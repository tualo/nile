#roadtext
{
    [highway=living_street],[highway=residential],[highway=tertiary],[highway=secondary],[highway=primary],[highway=trunk],[highway=motorway] {
      line-width: 0;
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
