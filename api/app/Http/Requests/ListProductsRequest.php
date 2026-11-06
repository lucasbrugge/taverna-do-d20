<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListProductsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'category' => [
                'nullable',
                'string',
                'exists:categories,slug',
            ],
            'sort' => [
                'nullable',
                Rule::in(['recent', 'price_asc', 'price_desc']),
            ],
            'page' => ['sometimes', 'integer', 'min:1'],
        ];
    }
}
