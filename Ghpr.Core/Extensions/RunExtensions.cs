﻿using System.IO;
using Ghpr.Core.Interfaces;
using Ghpr.Core.Utils;
using Newtonsoft.Json;

namespace Ghpr.Core.Extensions
{
    public static class RunExtensions
    {
        public static void Save(this IRun run, string path, string fileName = "")
        {
            if (fileName.Equals(""))
            {
                fileName = $"run_{run.RunInfo.Guid.ToString().ToLower()}.json";
            }
            run.RunInfo.FileName = fileName;
            Paths.Create(path);
            var fullRunPath = Path.Combine(path, fileName);
            using (var file = File.CreateText(fullRunPath))
            {
                var serializer = new JsonSerializer();
                serializer.Serialize(file, run);
            }
        }
    }
}