﻿using System;
using System.Linq;

namespace Backend.Gql {
    public static class StringExtensions {
        /// <summary>
        /// Converts a string to PascalCase
        /// </summary>
        /// <param name="str">String to convert</param>

        public static string ToPascalCase(this string str)
        {

            // Replace all non-letter and non-digits with an underscore and lowercase the rest.
            var sample = string.Join("", str?.Select(c => char.IsLetterOrDigit(c) ? c.ToString().ToLower() : "_").ToArray() ?? throw new InvalidOperationException());

            // Split the resulting string by underscore
            // Select first character, uppercase it and concatenate with the rest of the string
            var arr = sample.Split(new[] { '_' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(s => $"{s.Substring(0, 1).ToUpper()}{s.Substring(1)}");

            // Join the resulting collection
            sample = string.Join("", arr);

            return sample;
        }
    }
}